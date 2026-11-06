import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/db";
import {
  BookingError,
  cancelBooking,
  createBooking,
  generateReferenceCandidate,
  generateTicketCandidate,
  getBookingByReference,
  getBookingById,
  getBookingForUser,
  getBookingsForUser,
  getPassengerProfile,
  updatePassengerProfile,
} from "@/lib/services/booking-service";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/db", () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    flight: { findMany: vi.fn() },
    booking: {
      findUnique: vi.fn(),
      findUniqueOrThrow: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    ticket: { findUnique: vi.fn() },
    passengerProfile: { findUnique: vi.fn() },
    $transaction: vi.fn(),
  },
}));

const userFindUnique = vi.mocked(prisma.user.findUnique);
const flightFindMany = vi.mocked(prisma.flight.findMany);
const bookingFindUnique = vi.mocked(prisma.booking.findUnique);
const bookingFindUniqueOrThrow = vi.mocked(prisma.booking.findUniqueOrThrow);
const bookingFindFirst = vi.mocked(prisma.booking.findFirst);
const bookingFindMany = vi.mocked(prisma.booking.findMany);
const profileFindUnique = vi.mocked(prisma.passengerProfile.findUnique);
const ticketFindUnique = vi.mocked(prisma.ticket.findUnique);
const transaction = vi.mocked(prisma.$transaction);

const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
const dayAfter = new Date(Date.now() + 48 * 60 * 60 * 1000);

function makeFlight(overrides: Record<string, unknown> = {}) {
  return {
    id: "flight-1",
    flightNumber: "GA100",
    airlineId: "airline-1",
    originId: "airport-cgk",
    destinationId: "airport-dps",
    departureAt: tomorrow,
    arrivalAt: new Date(tomorrow.getTime() + 110 * 60 * 1000),
    price: 1_250_000,
    seatsAvailable: 20,
    createdAt: new Date(),
    airline: { id: "airline-1", code: "GA", name: "Garuda Indonesia" },
    origin: { id: "airport-cgk", code: "CGK", city: "Jakarta", name: "Soekarno-Hatta" },
    destination: { id: "airport-dps", code: "DPS", city: "Denpasar", name: "Ngurah Rai" },
    ...overrides,
  };
}

function makePassenger(profile: Record<string, unknown> | null) {
  return {
    id: "passenger-1",
    name: "Aditya Pratama",
    email: "penumpang@demo.test",
    passwordHash: "hash",
    role: "PASSENGER",
    createdAt: new Date(),
    profile,
  };
}

const completeProfile = {
  id: "profile-1",
  userId: "passenger-1",
  fullName: "Aditya Pratama",
  nik: "3171012506950001",
  phone: "081234567890",
  birthDate: new Date(1995, 5, 25),
  passportNumber: null,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("reference and ticket format", () => {
  it("membuat kode booking dengan format TRV-XXXXXX", () => {
    const reference = generateReferenceCandidate();
    expect(reference).toMatch(/^TRV-[A-Z2-9]{6}$/);
  });

  it("membuat nomor tiket dengan tahun berjalan", () => {
    const ticket = generateTicketCandidate(2026);
    expect(ticket).toMatch(/^TK-2026-[A-Z2-9]{6}$/);
  });
});

describe("createBooking", () => {
  it("membuat pemesanan sekali jalan, mengurangi kursi, dan mengirim email", async () => {
    userFindUnique.mockResolvedValue(makePassenger(completeProfile) as never);
    flightFindMany.mockResolvedValue([makeFlight()] as never);
    bookingFindUnique.mockResolvedValue(null);
    ticketFindUnique.mockResolvedValue(null);

    const createdBooking = {
      id: "booking-1",
      referenceCode: "TRV-ABC123",
      status: "CONFIRMED",
      totalPrice: 1_250_000,
      segments: [],
    };
    const tx = {
      flight: { updateMany: vi.fn().mockResolvedValue({ count: 1 }) },
      booking: {
        create: vi.fn().mockResolvedValue({ id: "booking-1" }),
        findUniqueOrThrow: vi.fn().mockResolvedValue(createdBooking),
      },
      emailOutbox: { create: vi.fn().mockResolvedValue({ id: "email-1" }) },
    };
    transaction.mockImplementation((async (callback: (client: typeof tx) => unknown) =>
      callback(tx)) as never);

    const result = await createBooking({
      bookerId: "passenger-1",
      passengerId: "passenger-1",
      tripType: "ONE_WAY",
      segments: [{ flightId: "flight-1", leg: "OUTBOUND", sequence: 1 }],
    });

    expect(result.id).toBe("booking-1");
    expect(tx.flight.updateMany).toHaveBeenCalledWith({
      where: { id: "flight-1", seatsAvailable: { gt: 0 } },
      data: { seatsAvailable: { decrement: 1 } },
    });
    expect(tx.booking.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "CONFIRMED",
          tripType: "ONE_WAY",
          totalPrice: 1_250_000,
        }),
      }),
    );
    expect(tx.emailOutbox.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ recipient: "penumpang@demo.test" }),
      }),
    );
  });

  it("membuat pemesanan pulang-pergi dengan dua segmen dan total harga", async () => {
    const outbound = makeFlight();
    const inbound = makeFlight({
      id: "flight-2",
      flightNumber: "GA101",
      originId: "airport-dps",
      destinationId: "airport-cgk",
      departureAt: dayAfter,
      arrivalAt: new Date(dayAfter.getTime() + 110 * 60 * 1000),
      price: 1_150_000,
    });
    userFindUnique.mockResolvedValue(makePassenger(completeProfile) as never);
    flightFindMany.mockResolvedValue([outbound, inbound] as never);
    bookingFindUnique.mockResolvedValue(null);
    ticketFindUnique.mockResolvedValue(null);

    const tx = {
      flight: { updateMany: vi.fn().mockResolvedValue({ count: 1 }) },
      booking: {
        create: vi.fn().mockResolvedValue({ id: "booking-pp" }),
        findUniqueOrThrow: vi.fn().mockResolvedValue({ id: "booking-pp" }),
      },
      emailOutbox: { create: vi.fn().mockResolvedValue({ id: "email-pp" }) },
    };
    transaction.mockImplementation((async (callback: (client: typeof tx) => unknown) =>
      callback(tx)) as never);

    const result = await createBooking({
      bookerId: "passenger-1",
      passengerId: "passenger-1",
      tripType: "ROUND_TRIP",
      segments: [
        { flightId: "flight-1", leg: "OUTBOUND", sequence: 1 },
        { flightId: "flight-2", leg: "RETURN", sequence: 2 },
      ],
    });

    expect(result.id).toBe("booking-pp");
    expect(tx.flight.updateMany).toHaveBeenCalledTimes(2);
    expect(tx.booking.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          tripType: "ROUND_TRIP",
          totalPrice: 2_400_000,
          segments: {
            create: [
              { flightId: "flight-1", leg: "OUTBOUND", sequence: 1 },
              { flightId: "flight-2", leg: "RETURN", sequence: 2 },
            ],
          },
        }),
      }),
    );
  });

  it("menolak pemesanan jika profil tidak lengkap", async () => {
    userFindUnique.mockResolvedValue(
      makePassenger({ ...completeProfile, nik: null, birthDate: null }) as never,
    );

    await expect(
      createBooking({
        bookerId: "passenger-1",
        passengerId: "passenger-1",
        tripType: "ONE_WAY",
        segments: [{ flightId: "flight-1", leg: "OUTBOUND", sequence: 1 }],
      }),
    ).rejects.toMatchObject({ code: "PROFILE_INCOMPLETE" });
    expect(transaction).not.toHaveBeenCalled();
  });

  it("menolak pulang-pergi dengan rute yang tidak terbalik", async () => {
    userFindUnique.mockResolvedValue(makePassenger(completeProfile) as never);
    flightFindMany.mockResolvedValue([
      makeFlight(),
      makeFlight({
        id: "flight-2",
        originId: "airport-cgk",
        destinationId: "airport-dps",
        departureAt: dayAfter,
        arrivalAt: new Date(dayAfter.getTime() + 110 * 60 * 1000),
      }),
    ] as never);

    await expect(
      createBooking({
        bookerId: "passenger-1",
        passengerId: "passenger-1",
        tripType: "ROUND_TRIP",
        segments: [
          { flightId: "flight-1", leg: "OUTBOUND", sequence: 1 },
          { flightId: "flight-2", leg: "RETURN", sequence: 2 },
        ],
      }),
    ).rejects.toBeInstanceOf(BookingError);
  });

  it("menolak jika kursi habis", async () => {
    userFindUnique.mockResolvedValue(makePassenger(completeProfile) as never);
    flightFindMany.mockResolvedValue([makeFlight({ seatsAvailable: 0 })] as never);

    await expect(
      createBooking({
        bookerId: "passenger-1",
        passengerId: "passenger-1",
        tripType: "ONE_WAY",
        segments: [{ flightId: "flight-1", leg: "OUTBOUND", sequence: 1 }],
      }),
    ).rejects.toMatchObject({ code: "SEAT_UNAVAILABLE" });
  });
});

describe("cancelBooking", () => {
  it("membatalkan pemesanan dan mengembalikan kursi", async () => {
    const booking = {
      id: "booking-1",
      bookerId: "passenger-1",
      passengerId: "passenger-1",
      status: "CONFIRMED",
      segments: [{ flightId: "flight-1", flight: { departureAt: tomorrow } }],
    };
    bookingFindUnique.mockResolvedValue(booking as never);
    bookingFindUniqueOrThrow.mockResolvedValue({ ...booking, status: "CANCELLED" } as never);

    const tx = {
      booking: { updateMany: vi.fn().mockResolvedValue({ count: 1 }) },
      flight: { update: vi.fn().mockResolvedValue({}) },
    };
    transaction.mockImplementation((async (callback: (client: typeof tx) => unknown) =>
      callback(tx)) as never);

    const result = await cancelBooking("booking-1", "passenger-1");
    expect(result.id).toBe("booking-1");
    expect(tx.booking.updateMany).toHaveBeenCalledWith({
      where: { id: "booking-1", status: { not: "CANCELLED" } },
      data: expect.objectContaining({ status: "CANCELLED" }),
    });
    expect(tx.flight.update).toHaveBeenCalledWith({
      where: { id: "flight-1" },
      data: { seatsAvailable: { increment: 1 } },
    });
  });

  it("menolak pembatalan ganda secara atomik", async () => {
    bookingFindUnique.mockResolvedValue({
      id: "booking-1",
      bookerId: "passenger-1",
      passengerId: "passenger-1",
      status: "CONFIRMED",
      segments: [{ flightId: "flight-1", flight: { departureAt: tomorrow } }],
    } as never);
    const tx = {
      booking: { updateMany: vi.fn().mockResolvedValue({ count: 0 }) },
      flight: { update: vi.fn() },
    };
    transaction.mockImplementation((async (callback: (client: typeof tx) => unknown) =>
      callback(tx)) as never);

    await expect(cancelBooking("booking-1", "passenger-1")).rejects.toMatchObject({
      code: "ALREADY_CANCELLED",
    });
    expect(tx.flight.update).not.toHaveBeenCalled();
  });

  it("menolak pembatalan oleh pengguna lain", async () => {
    bookingFindUnique.mockResolvedValue({
      id: "booking-1",
      bookerId: "other",
      passengerId: "other",
      status: "CONFIRMED",
      segments: [{ flightId: "flight-1", flight: { departureAt: tomorrow } }],
    } as never);

    await expect(cancelBooking("booking-1", "passenger-1")).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  it("menolak pembatalan jika jadwal sudah lewat", async () => {
    bookingFindUnique.mockResolvedValue({
      id: "booking-1",
      bookerId: "passenger-1",
      passengerId: "passenger-1",
      status: "CONFIRMED",
      segments: [
        {
          flightId: "flight-1",
          flight: { departureAt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
      ],
    } as never);

    await expect(cancelBooking("booking-1", "passenger-1")).rejects.toMatchObject({
      code: "CANCEL_NOT_ALLOWED",
    });
  });
});

describe("booking getters", () => {
  it("mengambil semua pemesanan milik pengguna", async () => {
    bookingFindMany.mockResolvedValue([{ id: "booking-1" }] as never);
    const result = await getBookingsForUser("passenger-1");
    expect(result).toHaveLength(1);
    expect(bookingFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { OR: [{ bookerId: "passenger-1" }, { passengerId: "passenger-1" }] },
      }),
    );
  });

  it("mengambil detail pemesanan dengan batas kepemilikan", async () => {
    bookingFindFirst.mockResolvedValue({ id: "booking-1" } as never);
    expect((await getBookingForUser("booking-1", "passenger-1"))?.id).toBe("booking-1");
    expect(bookingFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: "booking-1",
          OR: [{ bookerId: "passenger-1" }, { passengerId: "passenger-1" }],
        },
      }),
    );
  });

  it("mengambil pemesanan berdasarkan id", async () => {
    bookingFindUnique.mockResolvedValue({ id: "booking-1" } as never);
    expect((await getBookingById("booking-1"))?.id).toBe("booking-1");
  });

  it("mengambil pemesanan berdasarkan kode booking yang dinormalisasi", async () => {
    bookingFindFirst.mockResolvedValue({ id: "booking-1", referenceCode: "TRV-DEMO01" } as never);
    const result = await getBookingByReference(" trv-demo01 ");
    expect(result?.id).toBe("booking-1");
    expect(bookingFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { referenceCode: "TRV-DEMO01" } }),
    );
    bookingFindFirst.mockClear();
    expect(await getBookingByReference("   ")).toBeNull();
    expect(bookingFindFirst).not.toHaveBeenCalled();
  });

  it("mengambil profil penumpang", async () => {
    profileFindUnique.mockResolvedValue(completeProfile as never);
    const result = await getPassengerProfile("passenger-1");
    expect(result?.nik).toBe("3171012506950001");
  });
});

describe("updatePassengerProfile", () => {
  it("menyimpan profil dan menyelaraskan nama pengguna", async () => {
    const tx = {
      passengerProfile: { upsert: vi.fn().mockResolvedValue(completeProfile) },
      user: { update: vi.fn().mockResolvedValue({}) },
    };
    transaction.mockImplementation((async (callback: (client: typeof tx) => unknown) =>
      callback(tx)) as never);

    const result = await updatePassengerProfile("passenger-1", {
      fullName: "Aditya Pratama",
      nik: "3171012506950001",
      phone: "081234567890",
      birthDate: new Date(1995, 5, 25),
    });

    expect(result.nik).toBe("3171012506950001");
    expect(tx.passengerProfile.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: "passenger-1" },
        update: expect.objectContaining({ fullName: "Aditya Pratama" }),
      }),
    );
    const updateData = tx.passengerProfile.upsert.mock.calls[0][0].update;
    expect(updateData).not.toHaveProperty("passportNumber");
    expect(tx.user.update).toHaveBeenCalledWith({
      where: { id: "passenger-1" },
      data: { name: "Aditya Pratama" },
    });
  });

  it("memperbarui paspor hanya jika nilainya diberikan", async () => {
    const tx = {
      passengerProfile: { upsert: vi.fn().mockResolvedValue(completeProfile) },
      user: { update: vi.fn().mockResolvedValue({}) },
    };
    transaction.mockImplementation((async (callback: (client: typeof tx) => unknown) =>
      callback(tx)) as never);

    await updatePassengerProfile("passenger-1", {
      fullName: "Aditya Pratama",
      nik: "3171012506950001",
      phone: "081234567890",
      birthDate: new Date(1995, 5, 25),
      passportNumber: "B1234567",
    });

    expect(tx.passengerProfile.upsert.mock.calls[0][0].update).toEqual(
      expect.objectContaining({ passportNumber: "B1234567" }),
    );
  });
});
