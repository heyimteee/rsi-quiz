import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/db";
import {
  ItineraryError,
  addItinerarySegment,
  createItinerary,
  getItineraries,
  getItinerary,
} from "@/lib/services/itinerary-service";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/db", () => ({
  prisma: {
    itinerary: { findMany: vi.fn(), findFirst: vi.fn(), create: vi.fn() },
    itinerarySegment: { create: vi.fn() },
  },
}));

const itineraryFindMany = vi.mocked(prisma.itinerary.findMany);
const itineraryFindFirst = vi.mocked(prisma.itinerary.findFirst);
const itineraryCreate = vi.mocked(prisma.itinerary.create);
const segmentCreate = vi.mocked(prisma.itinerarySegment.create);

const airport = (id: string, code: string, city: string) => ({ id, code, city, name: city });

function futureDate(offsetDays: number) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function makeItinerary(segmentCount = 2, startOffset = 5) {
  return {
    id: "itinerary-1",
    memberId: "member-1",
    name: "Liburan",
    createdAt: new Date(),
    segments: Array.from({ length: segmentCount }, (_, index) => ({
      id: `segment-${index + 1}`,
      itineraryId: "itinerary-1",
      originId: index === 0 ? "airport-cgk" : "airport-dps",
      destinationId: index === 0 ? "airport-dps" : "airport-sub",
      departureDate: futureDate(startOffset + index),
      sequence: index + 1,
      origin: airport(index === 0 ? "airport-cgk" : "airport-dps", index === 0 ? "CGK" : "DPS", "Kota"),
      destination: airport(index === 0 ? "airport-dps" : "airport-sub", index === 0 ? "DPS" : "SUB", "Kota"),
    })),
  };
}

const validSegments = [
  { originId: "airport-cgk", destinationId: "airport-dps", departureDate: futureDate(3) },
  { originId: "airport-dps", destinationId: "airport-sub", departureDate: futureDate(5) },
];

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getItineraries", () => {
  it("mengambil rencana milik member", async () => {
    itineraryFindMany.mockResolvedValue([makeItinerary()] as never);
    const result = await getItineraries("member-1");
    expect(result).toHaveLength(1);
    expect(itineraryFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { memberId: "member-1" } }),
    );
  });

  it("mengambil satu rencana dengan batas kepemilikan", async () => {
    itineraryFindFirst.mockResolvedValue(makeItinerary() as never);
    const result = await getItinerary("itinerary-1", "member-1");
    expect(result?.segments).toHaveLength(2);
    expect(itineraryFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "itinerary-1", memberId: "member-1" } }),
    );
  });
});

describe("createItinerary", () => {
  it("menyimpan rencana dengan urutan rute", async () => {
    itineraryCreate.mockResolvedValue(makeItinerary() as never);
    const result = await createItinerary("member-1", "  Liburan  ", validSegments);
    expect(result.id).toBe("itinerary-1");
    expect(itineraryCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          memberId: "member-1",
          name: "Liburan",
          segments: {
            create: [
              expect.objectContaining({ sequence: 1 }),
              expect.objectContaining({ sequence: 2 }),
            ],
          },
        }),
      }),
    );
  });

  it("menolak nama kosong", async () => {
    await expect(createItinerary("member-1", "  ", validSegments)).rejects.toBeInstanceOf(
      ItineraryError,
    );
  });

  it("menolak rute tanpa segmen", async () => {
    await expect(createItinerary("member-1", "Liburan", [])).rejects.toMatchObject({
      code: "NO_SEGMENT",
    });
  });

  it("menolak asal dan tujuan yang sama", async () => {
    await expect(
      createItinerary("member-1", "Liburan", [
        { originId: "airport-cgk", destinationId: "airport-cgk", departureDate: new Date() },
      ]),
    ).rejects.toMatchObject({ code: "INVALID_ROUTE" });
  });

  it("menolak tanggal rute yang tidak berurutan", async () => {
    await expect(
      createItinerary("member-1", "Liburan", [
        { ...validSegments[0], departureDate: futureDate(8) },
        { ...validSegments[1], departureDate: futureDate(5) },
      ]),
    ).rejects.toMatchObject({ code: "INVALID_DATE" });
  });

  it("menolak tanggal rute di masa lalu", async () => {
    await expect(
      createItinerary("member-1", "Liburan", [
        { ...validSegments[0], departureDate: futureDate(-2) },
      ]),
    ).rejects.toMatchObject({ code: "INVALID_DATE" });
  });

  it("menolak rute yang tidak tersambung", async () => {
    await expect(
      createItinerary("member-1", "Liburan", [
        validSegments[0],
        { ...validSegments[1], originId: "airport-cgk" },
      ]),
    ).rejects.toMatchObject({ code: "INVALID_CONTINUITY" });
  });

  it("menolak lebih dari empat rute", async () => {
    const five = Array.from({ length: 5 }, (_, index) => ({
      originId: index % 2 === 0 ? "airport-cgk" : "airport-dps",
      destinationId: index % 2 === 0 ? "airport-dps" : "airport-cgk",
      departureDate: new Date(2026, 10, 10 + index),
    }));
    await expect(createItinerary("member-1", "Liburan", five)).rejects.toMatchObject({
      code: "MAX_SEGMENTS",
    });
  });
});

describe("addItinerarySegment", () => {
  it("menambahkan rute lanjutan dengan urutan berikutnya", async () => {
    itineraryFindFirst.mockResolvedValue(makeItinerary(2) as never);
    segmentCreate.mockResolvedValue({ id: "segment-3" } as never);

    await addItinerarySegment("itinerary-1", "member-1", {
      originId: "airport-sub",
      destinationId: "airport-cgk",
      departureDate: futureDate(12),
    });

    expect(segmentCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({ itineraryId: "itinerary-1", sequence: 3 }),
    });
  });

  it("menolak jika rencana bukan milik member", async () => {
    itineraryFindFirst.mockResolvedValue(null);
    await expect(
      addItinerarySegment("itinerary-1", "other", validSegments[0]),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("menolak rute kelima", async () => {
    itineraryFindFirst.mockResolvedValue(makeItinerary(4) as never);
    await expect(
      addItinerarySegment("itinerary-1", "member-1", {
        originId: "airport-sub",
        destinationId: "airport-cgk",
        departureDate: futureDate(20),
      }),
    ).rejects.toMatchObject({ code: "MAX_SEGMENTS" });
  });

  it("menolak tanggal sebelum rute terakhir", async () => {
    itineraryFindFirst.mockResolvedValue(makeItinerary(2, 10) as never);
    await expect(
      addItinerarySegment("itinerary-1", "member-1", {
        originId: "airport-sub",
        destinationId: "airport-cgk",
        departureDate: futureDate(8),
      }),
    ).rejects.toMatchObject({ code: "INVALID_DATE" });
  });

  it("menolak tanggal rute di masa lalu", async () => {
    itineraryFindFirst.mockResolvedValue(makeItinerary(2) as never);
    await expect(
      addItinerarySegment("itinerary-1", "member-1", {
        originId: "airport-sub",
        destinationId: "airport-cgk",
        departureDate: futureDate(-1),
      }),
    ).rejects.toMatchObject({ code: "INVALID_DATE" });
  });
});
