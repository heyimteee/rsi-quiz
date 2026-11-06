import "server-only";

import { endOfDay, startOfDay } from "date-fns";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { isSameLocalDay, searchFlights, type FlightSearchCriteria } from "@/lib/domain/flight";

export const flightInclude = {
  airline: true,
  origin: true,
  destination: true,
} satisfies Prisma.FlightInclude;

export type FlightWithRelations = Prisma.FlightGetPayload<{ include: typeof flightInclude }>;

export type FlightOffersCriteria = {
  originCode?: string | null;
  destinationCode?: string | null;
  date?: Date | string | null;
  timeFrom?: string | null;
  timeTo?: string | null;
  sort?: FlightSearchCriteria["sort"];
};

export async function getAirports() {
  return prisma.airport.findMany({ orderBy: { city: "asc" } });
}

export async function searchFlightOffers(criteria: FlightOffersCriteria) {
  if (!criteria.originCode || !criteria.destinationCode || !criteria.date) return [];
  const date = new Date(criteria.date);
  if (Number.isNaN(date.getTime())) return [];

  const now = new Date();
  const lowerBound = isSameLocalDay(date, now) ? now : startOfDay(date);
  const flights = await prisma.flight.findMany({
    where: {
      origin: { code: criteria.originCode.toUpperCase() },
      destination: { code: criteria.destinationCode.toUpperCase() },
      departureAt: {
        gte: lowerBound,
        lte: endOfDay(date),
      },
    },
    include: flightInclude,
    orderBy: { departureAt: "asc" },
  });

  return searchFlights(flights, {
    originCode: criteria.originCode,
    destinationCode: criteria.destinationCode,
    date,
    timeFrom: criteria.timeFrom,
    timeTo: criteria.timeTo,
    sort: criteria.sort ?? "departure_asc",
  });
}

export async function getFlightById(id: string) {
  return prisma.flight.findUnique({
    where: { id },
    include: flightInclude,
  });
}

export async function getFlightsByIds(ids: string[]) {
  return prisma.flight.findMany({
    where: { id: { in: ids } },
    include: flightInclude,
  });
}

export function isDepartureInFuture(departureAt: Date | string) {
  return new Date(departureAt).getTime() > Date.now();
}
