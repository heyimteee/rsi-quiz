import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/db";
import {
  getAirports,
  getFlightById,
  getFlightsByIds,
  isDepartureInFuture,
  searchFlightOffers,
} from "@/lib/services/flight-service";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/db", () => ({
  prisma: {
    airport: { findMany: vi.fn() },
    flight: { findMany: vi.fn(), findUnique: vi.fn() },
  },
}));

const airportFindMany = vi.mocked(prisma.airport.findMany);
const flightFindMany = vi.mocked(prisma.flight.findMany);
const flightFindUnique = vi.mocked(prisma.flight.findUnique);

const flight = {
  id: "flight-1",
  flightNumber: "GA100",
  airlineId: "airline-1",
  originId: "airport-cgk",
  destinationId: "airport-dps",
  departureAt: new Date(2026, 10, 10, 6, 30),
  arrivalAt: new Date(2026, 10, 10, 8, 20),
  price: 1_250_000,
  seatsAvailable: 20,
  createdAt: new Date(),
  airline: { id: "airline-1", code: "GA", name: "Garuda Indonesia" },
  origin: { id: "airport-cgk", code: "CGK", city: "Jakarta", name: "Soekarno-Hatta" },
  destination: { id: "airport-dps", code: "DPS", city: "Denpasar", name: "Ngurah Rai" },
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("searchFlightOffers", () => {
  it("mengembalikan kosong tanpa kriteria lengkap", async () => {
    expect(await searchFlightOffers({ originCode: "CGK" })).toEqual([]);
    expect(await searchFlightOffers({})).toEqual([]);
    expect(flightFindMany).not.toHaveBeenCalled();
  });

  it("mencari berdasarkan rute dan tanggal lalu mengurutkan harga", async () => {
    const cheaper = { ...flight, id: "flight-2", price: 900_000 };
    flightFindMany.mockResolvedValue([flight, cheaper] as never);

    const result = await searchFlightOffers({
      originCode: "cgk",
      destinationCode: "dps",
      date: new Date(2026, 10, 10),
      sort: "price_asc",
    });

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe("flight-2");
    expect(flightFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          origin: { code: "CGK" },
          destination: { code: "DPS" },
        }),
      }),
    );
  });

  it("membatasi hasil hari ini ke keberangkatan yang belum lewat", async () => {
    flightFindMany.mockResolvedValue([] as never);
    const before = Date.now();
    await searchFlightOffers({
      originCode: "CGK",
      destinationCode: "DPS",
      date: new Date(),
    });
    const call = flightFindMany.mock.calls.at(-1)?.[0] as
      | { where: { departureAt: { gte: Date } } }
      | undefined;
    expect(call?.where.departureAt.gte.getTime()).toBeGreaterThanOrEqual(before);
  });

  it("memfilter jendela waktu keberangkatan", async () => {
    flightFindMany.mockResolvedValue([flight] as never);
    const result = await searchFlightOffers({
      originCode: "CGK",
      destinationCode: "DPS",
      date: new Date(2026, 10, 10),
      timeFrom: "12:00",
    });
    expect(result).toHaveLength(0);
  });
});

describe("flight getters", () => {
  it("mengambil daftar bandara", async () => {
    airportFindMany.mockResolvedValue([
      { id: "1", code: "CGK", city: "Jakarta", name: "Soekarno-Hatta" },
    ] as never);
    const result = await getAirports();
    expect(result).toHaveLength(1);
    expect(airportFindMany).toHaveBeenCalledWith({ orderBy: { city: "asc" } });
  });

  it("mengambil penerbangan berdasarkan id", async () => {
    flightFindUnique.mockResolvedValue(flight as never);
    const result = await getFlightById("flight-1");
    expect(result?.flightNumber).toBe("GA100");
  });

  it("mengambil beberapa penerbangan berdasarkan id", async () => {
    flightFindMany.mockResolvedValue([flight] as never);
    const result = await getFlightsByIds(["flight-1"]);
    expect(result).toHaveLength(1);
  });

  it("memeriksa apakah keberangkatan masih di masa depan", () => {
    expect(isDepartureInFuture(new Date(Date.now() + 60_000))).toBe(true);
    expect(isDepartureInFuture(new Date(Date.now() - 60_000))).toBe(false);
  });
});
