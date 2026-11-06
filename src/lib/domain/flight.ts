export type FlightLike = {
  id: string;
  flightNumber: string;
  price: number;
  departureAt: Date | string;
  arrivalAt: Date | string;
  seatsAvailable: number;
  airline: { code: string; name: string };
  origin: { code: string; city: string };
  destination: { code: string; city: string };
};

export type FlightSearchCriteria = {
  originCode?: string | null;
  destinationCode?: string | null;
  date?: Date | string | null;
  timeFrom?: string | null;
  timeTo?: string | null;
  sort?: "price_asc" | "price_desc" | "departure_asc" | "duration_asc";
  limit?: number;
};

export function isSameLocalDay(a: Date | string, b: Date | string): boolean {
  const dateA = new Date(a);
  const dateB = new Date(b);
  return (
    dateA.getFullYear() === dateB.getFullYear() &&
    dateA.getMonth() === dateB.getMonth() &&
    dateA.getDate() === dateB.getDate()
  );
}

function parseMinutes(value: string | null | undefined): number | null {
  if (!value || !/^\d{1,2}:\d{2}$/.test(value)) return null;
  const [hours, minutes] = value.split(":").map(Number);
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}

export function isWithinTimeWindow(
  departureAt: Date | string,
  timeFrom?: string | null,
  timeTo?: string | null,
): boolean {
  const from = parseMinutes(timeFrom);
  const to = parseMinutes(timeTo);
  if (from === null && to === null) return true;
  const date = new Date(departureAt);
  const minutes = date.getHours() * 60 + date.getMinutes();
  if (from !== null && to !== null) {
    if (from <= to) return minutes >= from && minutes <= to;
    return minutes >= from || minutes <= to;
  }
  if (from !== null) return minutes >= from;
  return minutes <= (to as number);
}

export function filterFlights(flights: FlightLike[], criteria: FlightSearchCriteria): FlightLike[] {
  return flights.filter((flight) => {
    if (
      criteria.originCode &&
      flight.origin.code.toUpperCase() !== criteria.originCode.toUpperCase()
    ) {
      return false;
    }
    if (
      criteria.destinationCode &&
      flight.destination.code.toUpperCase() !== criteria.destinationCode.toUpperCase()
    ) {
      return false;
    }
    if (criteria.date && !isSameLocalDay(flight.departureAt, criteria.date)) return false;
    if (!isWithinTimeWindow(flight.departureAt, criteria.timeFrom, criteria.timeTo)) return false;
    return true;
  });
}

export function sortFlights(
  flights: FlightLike[],
  sort: FlightSearchCriteria["sort"] = "departure_asc",
): FlightLike[] {
  const sorted = [...flights];
  switch (sort) {
    case "price_asc":
      return sorted.sort((a, b) => a.price - b.price);
    case "price_desc":
      return sorted.sort((a, b) => b.price - a.price);
    case "duration_asc":
      return sorted.sort(
        (a, b) =>
          new Date(a.arrivalAt).getTime() -
          new Date(a.departureAt).getTime() -
          (new Date(b.arrivalAt).getTime() - new Date(b.departureAt).getTime()),
      );
    case "departure_asc":
    default:
      return sorted.sort(
        (a, b) => new Date(a.departureAt).getTime() - new Date(b.departureAt).getTime(),
      );
  }
}

export function searchFlights(flights: FlightLike[], criteria: FlightSearchCriteria): FlightLike[] {
  const result = sortFlights(filterFlights(flights, criteria), criteria.sort);
  return typeof criteria.limit === "number" ? result.slice(0, criteria.limit) : result;
}

export function getCheapestFlight(flights: FlightLike[]): FlightLike | null {
  const available = flights.filter((flight) => flight.seatsAvailable > 0);
  if (available.length === 0) return null;
  return available.reduce((cheapest, flight) =>
    flight.price < cheapest.price ? flight : cheapest,
  );
}

export function summarizeFlights(flights: FlightLike[]) {
  if (flights.length === 0) {
    return { count: 0, minPrice: 0, maxPrice: 0, fastestMinutes: 0 };
  }
  const durations = flights.map((flight) =>
    Math.max(
      0,
      Math.round(
        (new Date(flight.arrivalAt).getTime() - new Date(flight.departureAt).getTime()) / 60000,
      ),
    ),
  );
  return {
    count: flights.length,
    minPrice: Math.min(...flights.map((flight) => flight.price)),
    maxPrice: Math.max(...flights.map((flight) => flight.price)),
    fastestMinutes: Math.min(...durations),
  };
}
