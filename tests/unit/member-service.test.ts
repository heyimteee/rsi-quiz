import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/db";
import {
  MemberError,
  getMemberTickets,
  getValidationHistory,
  validateMemberTicket,
} from "@/lib/services/member-service";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/db", () => ({
  prisma: {
    booking: { findMany: vi.fn(), findFirst: vi.fn() },
    ticketValidation: { findMany: vi.fn() },
    $transaction: vi.fn(),
  },
}));

const bookingFindMany = vi.mocked(prisma.booking.findMany);
const bookingFindFirst = vi.mocked(prisma.booking.findFirst);
const validationFindMany = vi.mocked(prisma.ticketValidation.findMany);
const transaction = vi.mocked(prisma.$transaction);

const completeProfile = {
  id: "profile-1",
  userId: "member-1",
  fullName: "Dimas Nugroho",
  nik: "3171031103900003",
  phone: "081311112222",
  birthDate: new Date(1990, 2, 11),
  passportNumber: null,
};

function makeTicketBooking(overrides: Record<string, unknown> = {}) {
  return {
    id: "booking-1",
    referenceCode: "TRV-DEMO05",
    passengerId: "member-1",
    status: "CONFIRMED",
    tripType: "ONE_WAY",
    totalPrice: 1_330_000,
    createdAt: new Date(),
    passenger: { id: "member-1", profile: completeProfile },
    ticket: {
      id: "ticket-1",
      ticketNumber: "TK-2026-0001",
      validationStatus: "PENDING",
      validatedAt: null,
    },
    segments: [],
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getMemberTickets", () => {
  it("mengambil tiket milik member", async () => {
    bookingFindMany.mockResolvedValue([makeTicketBooking()] as never);
    const result = await getMemberTickets("member-1");
    expect(result).toHaveLength(1);
    expect(bookingFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { passengerId: "member-1", status: { not: "CANCELLED" } },
      }),
    );
  });
});

describe("validateMemberTicket", () => {
  it("menolak jika tiket tidak ditemukan", async () => {
    bookingFindFirst.mockResolvedValue(null);
    await expect(validateMemberTicket("member-1", "missing")).rejects.toBeInstanceOf(MemberError);
  });

  it("menolak jika pemesanan tidak memiliki tiket", async () => {
    bookingFindFirst.mockResolvedValue(makeTicketBooking({ ticket: null }) as never);
    await expect(validateMemberTicket("member-1", "booking-1")).rejects.toMatchObject({
      code: "TICKET_NOT_FOUND",
    });
  });

  it("mengembalikan status valid tanpa duplikasi jika sudah tervalidasi", async () => {
    bookingFindFirst.mockResolvedValue(
      makeTicketBooking({
        ticket: { id: "ticket-1", validationStatus: "VALID", ticketNumber: "TK-1" },
      }) as never,
    );
    const result = await validateMemberTicket("member-1", "booking-1");
    expect(result.alreadyValid).toBe(true);
    expect(transaction).not.toHaveBeenCalled();
  });

  it("menolak validasi jika profil tidak lengkap dan mencatat riwayat", async () => {
    bookingFindFirst.mockResolvedValue(
      makeTicketBooking({
        passenger: {
          id: "member-1",
          profile: { ...completeProfile, nik: null, birthDate: null },
        },
      }) as never,
    );
    const tx = {
      ticket: { updateMany: vi.fn().mockResolvedValue({ count: 1 }) },
      ticketValidation: { create: vi.fn().mockResolvedValue({}) },
    };
    transaction.mockImplementation((async (callback: (client: typeof tx) => unknown) =>
      callback(tx)) as never);

    const result = await validateMemberTicket("member-1", "booking-1");
    expect(result.status).toBe("REJECTED");
    expect(result.message).toBe("Data profil tidak lengkap");
    expect(result.missingLabels).toEqual(["NIK", "Tanggal lahir"]);
    expect(tx.ticket.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "ticket-1", validationStatus: { not: "VALID" } },
        data: expect.objectContaining({ validationStatus: "REJECTED" }),
      }),
    );
    expect(tx.ticketValidation.create).toHaveBeenCalled();
  });

  it("memvalidasi tiket jika profil lengkap", async () => {
    bookingFindFirst.mockResolvedValue(makeTicketBooking() as never);
    const tx = {
      ticket: { updateMany: vi.fn().mockResolvedValue({ count: 1 }) },
      ticketValidation: { create: vi.fn().mockResolvedValue({}) },
    };
    transaction.mockImplementation((async (callback: (client: typeof tx) => unknown) =>
      callback(tx)) as never);

    const result = await validateMemberTicket("member-1", "booking-1");
    expect(result.status).toBe("VALID");
    expect(result.alreadyValid).toBe(false);
    expect(tx.ticket.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "ticket-1", validationStatus: { not: "VALID" } },
        data: expect.objectContaining({ validationStatus: "VALID" }),
      }),
    );
  });

  it("menolak validasi tiket dari pemesanan yang dibatalkan", async () => {
    bookingFindFirst.mockResolvedValue(
      makeTicketBooking({ status: "CANCELLED" }) as never,
    );
    await expect(validateMemberTicket("member-1", "booking-1")).rejects.toMatchObject({
      code: "TICKET_CANCELLED",
    });
    expect(transaction).not.toHaveBeenCalled();
  });

  it("mengembalikan alreadyValid jika transisi kalah balapan", async () => {
    bookingFindFirst.mockResolvedValue(makeTicketBooking() as never);
    const tx = {
      ticket: { updateMany: vi.fn().mockResolvedValue({ count: 0 }) },
      ticketValidation: { create: vi.fn() },
    };
    transaction.mockImplementation((async (callback: (client: typeof tx) => unknown) =>
      callback(tx)) as never);

    const result = await validateMemberTicket("member-1", "booking-1");
    expect(result.alreadyValid).toBe(true);
    expect(tx.ticketValidation.create).not.toHaveBeenCalled();
  });
});

describe("getValidationHistory", () => {
  it("mengambil riwayat validasi terbaru", async () => {
    validationFindMany.mockResolvedValue([{ id: "validation-1" }] as never);
    const result = await getValidationHistory("member-1");
    expect(result).toHaveLength(1);
    expect(validationFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { profileId: "member-1" }, take: 8 }),
    );
  });
});
