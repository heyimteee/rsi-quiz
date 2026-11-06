import { beforeEach, describe, expect, it, vi } from "vitest";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/session";
import { createBooking, BookingError } from "@/lib/services/booking-service";
import { getVisitorById } from "@/lib/services/travel-service";
import { bookForVisitorAction } from "@/lib/actions/travel-actions";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@/lib/auth/session", () => ({ requireRole: vi.fn() }));
vi.mock("@/lib/services/travel-service", () => ({ getVisitorById: vi.fn() }));
vi.mock("@/lib/services/booking-service", () => {
  class MockBookingError extends Error {
    code: string;
    constructor(code: string, message: string) {
      super(message);
      this.code = code;
    }
  }
  return { BookingError: MockBookingError, createBooking: vi.fn() };
});

const requireRoleMock = vi.mocked(requireRole);
const createBookingMock = vi.mocked(createBooking);
const getVisitorMock = vi.mocked(getVisitorById);
const redirectMock = vi.mocked(redirect);
const revalidateMock = vi.mocked(revalidatePath);

function form(fields: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}

function visitor() {
  return {
    id: "visitor-1",
    name: "Siti Rahma",
    email: "pengunjung@demo.test",
    role: "VISITOR",
    profile: {
      id: "profile-1",
      userId: "visitor-1",
      fullName: "Siti Rahma",
      nik: "3171042209940004",
      phone: "081355556666",
      birthDate: new Date(1994, 8, 22),
      passportNumber: null,
    },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  requireRoleMock.mockResolvedValue({
    id: "manager-1",
    name: "Bima Santoso",
    email: "travel@demo.test",
    role: "TRAVEL_MANAGER",
  });
  redirectMock.mockImplementation((() => undefined) as never);
});

describe("bookForVisitorAction", () => {
  it("memerlukan peran manajer travel", async () => {
    requireRoleMock.mockRejectedValue(new Error("NEXT_REDIRECT"));
    await expect(
      bookForVisitorAction({}, form({ visitorId: "visitor-1", flightId: "flight-1" })),
    ).rejects.toThrow("NEXT_REDIRECT");
    expect(requireRoleMock).toHaveBeenCalledWith("TRAVEL_MANAGER");
  });

  it("menolak jika pengunjung belum dipilih", async () => {
    const result = await bookForVisitorAction({}, form({ flightId: "flight-1" }));
    expect(result.error).toBe("Pilih pengunjung terlebih dahulu");
  });

  it("menolak pengunjung yang tidak ditemukan", async () => {
    getVisitorMock.mockResolvedValue(null);
    const result = await bookForVisitorAction(
      {},
      form({ visitorId: "missing", flightId: "flight-1" }),
    );
    expect(result.error).toBe("Data pengunjung tidak ditemukan");
  });

  it("membuat booking atas nama manajer dan pengunjung lalu redirect", async () => {
    getVisitorMock.mockResolvedValue(visitor() as never);
    createBookingMock.mockResolvedValue({ id: "booking-1" } as never);

    const result = await bookForVisitorAction(
      {},
      form({ visitorId: "visitor-1", flightId: "flight-1" }),
    );

    expect(result).toBeUndefined();
    expect(createBookingMock).toHaveBeenCalledWith({
      bookerId: "manager-1",
      passengerId: "visitor-1",
      tripType: "ONE_WAY",
      segments: [{ flightId: "flight-1", leg: "OUTBOUND", sequence: 1 }],
    });
    expect(revalidateMock).toHaveBeenCalledWith("/travel/pemesanan");
    expect(revalidateMock).toHaveBeenCalledWith("/tiket-saya");
    expect(redirectMock).toHaveBeenCalledWith("/travel/pemesanan/booking-1?baru=1");
  });

  it("meneruskan pesan BookingError", async () => {
    getVisitorMock.mockResolvedValue(visitor() as never);
    createBookingMock.mockRejectedValue(new BookingError("SEAT_UNAVAILABLE", "Kursi habis"));
    const result = await bookForVisitorAction(
      {},
      form({ visitorId: "visitor-1", flightId: "flight-1" }),
    );
    expect(result.error).toBe("Kursi habis");
    expect(redirectMock).not.toHaveBeenCalled();
  });
});
