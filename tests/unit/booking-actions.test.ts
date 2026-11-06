import { beforeEach, describe, expect, it, vi } from "vitest";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireRole, requireUser } from "@/lib/auth/session";
import {
  BookingError,
  cancelBooking,
  createBooking,
  updatePassengerProfile,
} from "@/lib/services/booking-service";
import {
  bookFlightAction,
  bookRoundTripAction,
  cancelBookingAction,
} from "@/lib/actions/booking-actions";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@/lib/auth/session", () => ({ requireRole: vi.fn(), requireUser: vi.fn() }));
vi.mock("@/lib/services/booking-service", () => {
  class MockBookingError extends Error {
    code: string;
    constructor(code: string, message: string) {
      super(message);
      this.code = code;
    }
  }
  return {
    BookingError: MockBookingError,
    createBooking: vi.fn(),
    updatePassengerProfile: vi.fn(),
    cancelBooking: vi.fn(),
  };
});

const requireRoleMock = vi.mocked(requireRole);
const requireUserMock = vi.mocked(requireUser);
const createBookingMock = vi.mocked(createBooking);
const updateProfileMock = vi.mocked(updatePassengerProfile);
const cancelBookingMock = vi.mocked(cancelBooking);
const redirectMock = vi.mocked(redirect);
const revalidateMock = vi.mocked(revalidatePath);

function form(fields: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}

const identity = {
  fullName: "Aditya Pratama",
  nik: "3171012506950001",
  phone: "081234567890",
  birthDate: "1995-06-25",
};

beforeEach(() => {
  vi.clearAllMocks();
  requireRoleMock.mockResolvedValue({
    id: "passenger-1",
    name: "Aditya Pratama",
    email: "penumpang@demo.test",
    role: "PASSENGER",
  });
  requireUserMock.mockResolvedValue({
    id: "passenger-1",
    name: "Aditya Pratama",
    email: "penumpang@demo.test",
    role: "PASSENGER",
  });
  updateProfileMock.mockResolvedValue({} as never);
  redirectMock.mockImplementation((() => undefined) as never);
});

describe("bookFlightAction", () => {
  it("menyimpan identitas lalu membuat pemesanan sekali jalan", async () => {
    createBookingMock.mockResolvedValue({ id: "booking-1" } as never);

    const result = await bookFlightAction({}, form({ ...identity, flightId: "flight-1" }));

    expect(result).toBeUndefined();
    expect(requireRoleMock).toHaveBeenCalledWith(["PASSENGER", "MEMBER"]);
    expect(updateProfileMock).toHaveBeenCalledWith("passenger-1", {
      fullName: identity.fullName,
      nik: identity.nik,
      phone: identity.phone,
      birthDate: new Date(1995, 5, 25, 12),
    });
    expect(createBookingMock).toHaveBeenCalledWith({
      bookerId: "passenger-1",
      passengerId: "passenger-1",
      tripType: "ONE_WAY",
      segments: [{ flightId: "flight-1", leg: "OUTBOUND", sequence: 1 }],
    });
    expect(revalidateMock).toHaveBeenCalledWith("/pemesanan");
    expect(redirectMock).toHaveBeenCalledWith("/pemesanan/booking-1?baru=1");
  });

  it("tidak melanjutkan jika otorisasi peran ditolak", async () => {
    requireRoleMock.mockRejectedValue(new Error("NEXT_REDIRECT"));
    await expect(
      bookFlightAction({}, form({ ...identity, flightId: "flight-1" })),
    ).rejects.toThrow("NEXT_REDIRECT");
    expect(updateProfileMock).not.toHaveBeenCalled();
    expect(createBookingMock).not.toHaveBeenCalled();
  });

  it("menolak jika penerbangan tidak dipilih", async () => {
    const result = await bookFlightAction({}, form(identity));
    expect(result.error).toBe("Penerbangan belum dipilih");
    expect(createBookingMock).not.toHaveBeenCalled();
  });

  it("mengembalikan error validasi identitas tanpa menyimpan", async () => {
    const result = await bookFlightAction(
      {},
      form({ ...identity, nik: "123", flightId: "flight-1" }),
    );
    expect(result.fieldErrors?.nik).toContain("16 digit");
    expect(updateProfileMock).not.toHaveBeenCalled();
  });

  it("meneruskan pesan BookingError", async () => {
    createBookingMock.mockRejectedValue(new BookingError("SEAT_UNAVAILABLE", "Kursi habis"));
    const result = await bookFlightAction({}, form({ ...identity, flightId: "flight-1" }));
    expect(result.error).toBe("Kursi habis");
    expect(redirectMock).not.toHaveBeenCalled();
  });
});

describe("bookRoundTripAction", () => {
  it("membuat pemesanan pulang-pergi dengan dua segmen", async () => {
    createBookingMock.mockResolvedValue({ id: "booking-pp" } as never);

    const result = await bookRoundTripAction(
      {},
      form({ ...identity, outboundId: "flight-1", returnId: "flight-2" }),
    );

    expect(result).toBeUndefined();
    expect(createBookingMock).toHaveBeenCalledWith({
      bookerId: "passenger-1",
      passengerId: "passenger-1",
      tripType: "ROUND_TRIP",
      segments: [
        { flightId: "flight-1", leg: "OUTBOUND", sequence: 1 },
        { flightId: "flight-2", leg: "RETURN", sequence: 2 },
      ],
    });
    expect(redirectMock).toHaveBeenCalledWith("/pemesanan/booking-pp?baru=1&pp=1");
  });

  it("menolak jika salah satu penerbangan tidak dipilih", async () => {
    const result = await bookRoundTripAction({}, form({ ...identity, outboundId: "flight-1" }));
    expect(result.error).toBe("Penerbangan tidak tersedia untuk kriteria yang dipilih");
  });
});

describe("cancelBookingAction", () => {
  it("membatalkan dan kembali ke detail", async () => {
    cancelBookingMock.mockResolvedValue({ id: "booking-1" } as never);
    await cancelBookingAction(form({ bookingId: "booking-1" }));
    expect(cancelBookingMock).toHaveBeenCalledWith("booking-1", "passenger-1");
    expect(redirectMock).toHaveBeenCalledWith("/pemesanan/booking-1?dibatalkan=1");
  });

  it("mengarahkan kembali dengan pesan jika pembatalan gagal", async () => {
    cancelBookingMock.mockRejectedValue(
      new BookingError("CANCEL_NOT_ALLOWED", "Jadwal sudah lewat"),
    );
    await cancelBookingAction(form({ bookingId: "booking-1" }));
    expect(redirectMock).toHaveBeenCalledWith(
      `/pemesanan/booking-1?gagal=${encodeURIComponent("Jadwal sudah lewat")}`,
    );
  });
});
