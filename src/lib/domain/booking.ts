import { calculateLeaveDuration } from "@/lib/domain/leave";
import { MESSAGES } from "@/lib/constants";
import { startOfDay } from "date-fns";

export type BookingLike = {
  id: string;
  referenceCode: string;
  status: string;
  totalPrice: number;
  createdAt: Date | string;
};

export function calculateTotalPrice(flights: Array<{ price: number }>): number {
  return flights.reduce((sum, flight) => sum + (Number.isFinite(flight.price) ? flight.price : 0), 0);
}

export function filterBookingsByStatus<T extends { status: string }>(
  bookings: T[],
  status?: string | null,
): T[] {
  if (!status || status === "all" || status === "semua") return bookings;
  const normalized = status.toUpperCase();
  return bookings.filter((booking) => booking.status.toUpperCase() === normalized);
}

export function normalizeBookingReference(value: string | null | undefined): string {
  return (value ?? "").trim().toUpperCase();
}

export function validateBookingReference<T extends { referenceCode: string }>(
  input: string | null | undefined,
  bookings: T[],
): { valid: boolean; booking: T | null; normalized: string } {
  const normalized = normalizeBookingReference(input);
  if (!normalized) return { valid: false, booking: null, normalized };
  const booking =
    bookings.find((item) => normalizeBookingReference(item.referenceCode) === normalized) ?? null;
  return { valid: booking !== null, booking, normalized };
}

export function canCancelBooking(
  booking: { status: string; departureAt: Date | string },
  now: Date = new Date(),
): boolean {
  if (booking.status.toUpperCase() === "CANCELLED") return false;
  const departure = new Date(booking.departureAt);
  if (Number.isNaN(departure.getTime())) return false;
  return departure.getTime() > now.getTime();
}

export function validateReturnDate(
  departure: Date | string | null | undefined,
  returnDate: Date | string | null | undefined,
): { valid: boolean; message?: string } {
  if (!departure || !returnDate) {
    return { valid: false, message: "Tanggal keberangkatan dan tanggal kepulangan wajib diisi" };
  }
  const departureDate = new Date(departure);
  const returnDateValue = new Date(returnDate);
  if (Number.isNaN(departureDate.getTime()) || Number.isNaN(returnDateValue.getTime())) {
    return { valid: false, message: "Format tanggal tidak valid" };
  }
  if (startOfDay(returnDateValue) < startOfDay(departureDate)) {
    return { valid: false, message: MESSAGES.RETURN_BEFORE_DEPARTURE };
  }
  return { valid: true };
}

export function validateTripCriteria(input: {
  originCode?: string | null;
  destinationCode?: string | null;
}): { valid: boolean; message?: string } {
  if (!input.originCode || !input.destinationCode) {
    return { valid: false, message: "Kota keberangkatan dan tujuan wajib dipilih" };
  }
  if (input.originCode.toUpperCase() === input.destinationCode.toUpperCase()) {
    return { valid: false, message: "Kota keberangkatan dan tujuan tidak boleh sama" };
  }
  return { valid: true };
}

export function calculateTripDurationDays(start: Date | string, end: Date | string): number {
  return calculateLeaveDuration(start, end);
}
