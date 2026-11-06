import { describe, expect, it } from "vitest";
import {
  getCheapestFlight,
  isSameLocalDay,
  isWithinTimeWindow,
  searchFlights,
  summarizeFlights,
  type FlightLike,
} from "@/lib/domain/flight";

const flights: FlightLike[] = [
  {
    id: "1",
    flightNumber: "GA100",
    price: 1500000,
    departureAt: new Date(2026, 10, 10, 6, 30),
    arrivalAt: new Date(2026, 10, 10, 8, 20),
    seatsAvailable: 20,
    airline: { code: "GA", name: "Garuda Indonesia" },
    origin: { code: "CGK", city: "Jakarta" },
    destination: { code: "DPS", city: "Denpasar" },
  },
  {
    id: "2",
    flightNumber: "JT200",
    price: 900000,
    departureAt: new Date(2026, 10, 10, 18, 40),
    arrivalAt: new Date(2026, 10, 10, 20, 30),
    seatsAvailable: 15,
    airline: { code: "JT", name: "Lion Air" },
    origin: { code: "CGK", city: "Jakarta" },
    destination: { code: "DPS", city: "Denpasar" },
  },
  {
    id: "3",
    flightNumber: "QG300",
    price: 1100000,
    departureAt: new Date(2026, 10, 11, 12, 15),
    arrivalAt: new Date(2026, 10, 11, 13, 45),
    seatsAvailable: 30,
    airline: { code: "QG", name: "Citilink" },
    origin: { code: "CGK", city: "Jakarta" },
    destination: { code: "SUB", city: "Surabaya" },
  },
];

describe("flight search", () => {
  it("memfilter berdasarkan rute dan tanggal", () => {
    const result = searchFlights(flights, {
      originCode: "CGK",
      destinationCode: "DPS",
      date: new Date(2026, 10, 10),
    });
    expect(result).toHaveLength(2);
  });

  it("memfilter berdasarkan jendela waktu keberangkatan", () => {
    const result = searchFlights(flights, {
      date: new Date(2026, 10, 10),
      timeFrom: "12:00",
      timeTo: "23:59",
    });
    expect(result.map((flight) => flight.id)).toEqual(["2"]);
  });

  it("mendukung jendela waktu yang melewati tengah malam", () => {
    expect(isWithinTimeWindow(new Date(2026, 10, 10, 23, 0), "22:00", "02:00")).toBe(true);
    expect(isWithinTimeWindow(new Date(2026, 10, 10, 12, 0), "22:00", "02:00")).toBe(false);
  });

  it("mengurutkan harga terendah", () => {
    const result = searchFlights(flights, {
      date: new Date(2026, 10, 10),
      sort: "price_asc",
    });
    expect(result[0].id).toBe("2");
  });

  it("membatasi jumlah hasil", () => {
    expect(searchFlights(flights, { sort: "price_asc", limit: 1 })).toHaveLength(1);
  });

  it("mengembalikan harga termurah dan ringkasan", () => {
    expect(getCheapestFlight(flights)?.id).toBe("2");
    expect(getCheapestFlight([])).toBeNull();
    expect(summarizeFlights([]).count).toBe(0);
    expect(summarizeFlights(flights).count).toBe(3);
  });

  it("membandingkan hari lokal", () => {
    expect(isSameLocalDay(new Date(2026, 10, 10, 1), new Date(2026, 10, 10, 23))).toBe(true);
    expect(isSameLocalDay(new Date(2026, 10, 10), new Date(2026, 10, 11))).toBe(false);
  });
});
