import { beforeEach, describe, expect, it, vi } from "vitest";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSession, requireRole } from "@/lib/auth/session";
import { updatePassengerProfile } from "@/lib/services/booking-service";
import { validateMemberTicket, MemberError } from "@/lib/services/member-service";
import {
  addItinerarySegment,
  createItinerary,
  ItineraryError,
} from "@/lib/services/itinerary-service";
import {
  addItinerarySegmentAction,
  createItineraryAction,
  updateProfileAction,
  validateTicketAction,
} from "@/lib/actions/member-actions";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@/lib/auth/session", () => ({
  requireRole: vi.fn(),
  createSession: vi.fn(),
}));
vi.mock("@/lib/services/booking-service", () => ({
  updatePassengerProfile: vi.fn(),
}));
vi.mock("@/lib/services/member-service", () => {
  class MockMemberError extends Error {
    code: string;
    constructor(code: string, message: string) {
      super(message);
      this.code = code;
    }
  }
  return { MemberError: MockMemberError, validateMemberTicket: vi.fn() };
});
vi.mock("@/lib/services/itinerary-service", () => {
  class MockItineraryError extends Error {
    code: string;
    constructor(code: string, message: string) {
      super(message);
      this.code = code;
    }
  }
  return {
    ItineraryError: MockItineraryError,
    createItinerary: vi.fn(),
    addItinerarySegment: vi.fn(),
  };
});

const requireRoleMock = vi.mocked(requireRole);
const createSessionMock = vi.mocked(createSession);
const updateProfileMock = vi.mocked(updatePassengerProfile);
const validateTicketMock = vi.mocked(validateMemberTicket);
const createItineraryMock = vi.mocked(createItinerary);
const addSegmentMock = vi.mocked(addItinerarySegment);
const redirectMock = vi.mocked(redirect);
const revalidateMock = vi.mocked(revalidatePath);

function form(fields: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}

function dateInput(offsetDays: number) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

const identity = {
  fullName: "Dimas Nugroho",
  nik: "3171031103900003",
  phone: "081311112222",
  birthDate: "1990-03-11",
};

beforeEach(() => {
  vi.clearAllMocks();
  requireRoleMock.mockResolvedValue({
    id: "member-1",
    name: "Dimas Nugroho",
    email: "member@demo.test",
    role: "MEMBER",
  });
  redirectMock.mockImplementation((() => undefined) as never);
});

describe("updateProfileAction", () => {
  it("menyimpan profil, memperbarui sesi, dan mengembalikan sukses", async () => {
    const result = await updateProfileAction({}, form({ ...identity, passportNumber: "C7654321" }));
    expect(result.success).toBe("Data profil berhasil diperbarui");
    expect(updateProfileMock).toHaveBeenCalledWith("member-1", {
      fullName: identity.fullName,
      nik: identity.nik,
      phone: identity.phone,
      birthDate: new Date(1990, 2, 11, 12),
      passportNumber: "C7654321",
    });
    expect(createSessionMock).toHaveBeenCalled();
    expect(revalidateMock).toHaveBeenCalledWith("/member/profil");
  });

  it("mengembalikan error field untuk NIK tidak valid", async () => {
    const result = await updateProfileAction({}, form({ ...identity, nik: "123" }));
    expect(result.fieldErrors?.nik).toContain("16 digit");
    expect(updateProfileMock).not.toHaveBeenCalled();
  });

  it("menolak tanggal lahir di masa depan", async () => {
    const future = new Date();
    future.setFullYear(future.getFullYear() + 1);
    const result = await updateProfileAction(
      {},
      form({ ...identity, birthDate: future.toISOString().slice(0, 10) }),
    );
    expect(result.fieldErrors?.birthDate).toContain("masa depan");
  });
});

describe("validateTicketAction", () => {
  it("mengembalikan status valid dari service", async () => {
    validateTicketMock.mockResolvedValue({
      status: "VALID",
      message: "Tiket berhasil divalidasi",
      alreadyValid: false,
      missingLabels: [],
      booking: { referenceCode: "TRV-DEMO05" },
    } as never);

    const result = await validateTicketAction({}, form({ bookingId: "booking-1" }));
    expect(result.status).toBe("VALID");
    expect(result.reference).toBe("TRV-DEMO05");
    expect(revalidateMock).toHaveBeenCalledWith("/member/validasi");
  });

  it("mengembalikan status rejected dengan daftar field", async () => {
    validateTicketMock.mockResolvedValue({
      status: "REJECTED",
      message: "Data profil tidak lengkap",
      alreadyValid: false,
      missingLabels: ["NIK", "Tanggal lahir"],
      booking: { referenceCode: "TRV-DEMO06" },
    } as never);
    const result = await validateTicketAction({}, form({ bookingId: "booking-2" }));
    expect(result.status).toBe("REJECTED");
    expect(result.missingLabels).toEqual(["NIK", "Tanggal lahir"]);
  });

  it("menangani MemberError", async () => {
    validateTicketMock.mockRejectedValue(new MemberError("TICKET_CANCELLED", "Tiket dibatalkan"));
    const result = await validateTicketAction({}, form({ bookingId: "booking-3" }));
    expect(result.error).toBe("Tiket dibatalkan");
  });

  it("menolak jika tiket belum dipilih", async () => {
    const result = await validateTicketAction({}, form({}));
    expect(result.error).toBe("Pilih tiket yang ingin divalidasi");
  });
});

function itineraryForm(segmentCount: number) {
  const data = new FormData();
  data.set("name", "Rencana Uji");
  const origins = ["a", "b", "c", "d", "e"];
  const destinations = ["b", "c", "d", "e", "f"];
  for (let index = 0; index < segmentCount; index++) {
    data.append("origin", origins[index]);
    data.append("destination", destinations[index]);
    data.append("departureDate", dateInput(index + 3));
  }
  return data;
}

describe("createItineraryAction", () => {
  it("menyimpan rute dan redirect ke detail", async () => {
    createItineraryMock.mockResolvedValue({ id: "itinerary-1" } as never);
    const result = await createItineraryAction({}, itineraryForm(2));
    expect(result).toBeUndefined();
    expect(createItineraryMock).toHaveBeenCalledWith(
      "member-1",
      "Rencana Uji",
      expect.arrayContaining([
        expect.objectContaining({ originId: "a", destinationId: "b" }),
        expect.objectContaining({ originId: "b", destinationId: "c" }),
      ]),
    );
    expect(redirectMock).toHaveBeenCalledWith("/member/rencana/itinerary-1?baru=1");
  });

  it("menolak lebih dari empat rute", async () => {
    const result = await createItineraryAction({}, itineraryForm(5));
    expect(result.error).toContain("4 rute");
    expect(createItineraryMock).not.toHaveBeenCalled();
  });

  it("menolak rute yang tidak tersambung", async () => {
    const data = new FormData();
    data.set("name", "Rencana Uji");
    data.append("origin", "a");
    data.append("destination", "b");
    data.append("departureDate", dateInput(3));
    data.append("origin", "x");
    data.append("destination", "c");
    data.append("departureDate", dateInput(4));
    const result = await createItineraryAction({}, data);
    expect(result.error).toContain("harus sama");
  });

  it("meneruskan ItineraryError", async () => {
    createItineraryMock.mockRejectedValue(new ItineraryError("INVALID_DATE", "Tanggal salah"));
    const result = await createItineraryAction({}, itineraryForm(2));
    expect(result.error).toBe("Tanggal salah");
  });
});

describe("addItinerarySegmentAction", () => {
  it("menambahkan rute dan redirect dengan status sukses", async () => {
    addSegmentMock.mockResolvedValue({ id: "segment-3" } as never);
    const result = await addItinerarySegmentAction(
      {},
      form({
        itineraryId: "itinerary-1",
        origin: "b",
        destination: "c",
        departureDate: dateInput(5),
      }),
    );
    expect(result).toBeUndefined();
    expect(addSegmentMock).toHaveBeenCalledWith(
      "itinerary-1",
      "member-1",
      expect.objectContaining({ originId: "b", destinationId: "c" }),
    );
    expect(redirectMock).toHaveBeenCalledWith("/member/rencana/itinerary-1?sukses=1");
  });

  it("menolak asal dan tujuan yang sama", async () => {
    const result = await addItinerarySegmentAction(
      {},
      form({
        itineraryId: "itinerary-1",
        origin: "b",
        destination: "b",
        departureDate: dateInput(5),
      }),
    );
    expect(result.error).toBe("Kota asal dan tujuan tidak boleh sama");
  });
});
