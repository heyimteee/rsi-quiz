import "server-only";

import { randomInt } from "node:crypto";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { checkProfileCompleteness } from "@/lib/domain/profile";
import { MESSAGES } from "@/lib/constants";
import { canCancelBooking, calculateTotalPrice, normalizeBookingReference } from "@/lib/domain/booking";
import { formatDateTime, formatIDR } from "@/lib/utils";

export const bookingInclude = {
  booker: { select: { id: true, name: true, email: true, role: true } },
  passenger: {
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      profile: true,
    },
  },
  ticket: true,
  segments: {
    include: {
      flight: {
        include: {
          airline: true,
          origin: true,
          destination: true,
        },
      },
    },
    orderBy: { sequence: "asc" as const },
  },
} satisfies Prisma.BookingInclude;

export type BookingWithDetails = Prisma.BookingGetPayload<{ include: typeof bookingInclude }>;

const REFERENCE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export class BookingError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "BookingError";
    this.code = code;
  }
}

export function generateReferenceCandidate() {
  const token = Array.from(
    { length: 6 },
    () => REFERENCE_ALPHABET[randomInt(0, REFERENCE_ALPHABET.length)],
  ).join("");
  return `TRV-${token}`;
}

export function generateTicketCandidate(year = new Date().getFullYear()) {
  const token = Array.from(
    { length: 6 },
    () => REFERENCE_ALPHABET[randomInt(0, REFERENCE_ALPHABET.length)],
  ).join("");
  return `TK-${year}-${token}`;
}

async function createUniqueReference() {
  for (let attempt = 0; attempt < 12; attempt++) {
    const candidate = generateReferenceCandidate();
    const existing = await prisma.booking.findUnique({ where: { referenceCode: candidate } });
    if (!existing) return candidate;
  }
  throw new BookingError("REFERENCE_GENERATION_FAILED", "Gagal membuat kode booking. Coba lagi.");
}

async function createUniqueTicketNumber() {
  for (let attempt = 0; attempt < 12; attempt++) {
    const candidate = generateTicketCandidate();
    const existing = await prisma.ticket.findUnique({ where: { ticketNumber: candidate } });
    if (!existing) return candidate;
  }
  throw new BookingError("TICKET_GENERATION_FAILED", "Gagal membuat nomor tiket. Coba lagi.");
}

export type CreateBookingSegmentInput = {
  flightId: string;
  leg: "OUTBOUND" | "RETURN" | "SEGMENT";
  sequence: number;
};

export type CreateBookingInput = {
  bookerId: string;
  passengerId: string;
  tripType: "ONE_WAY" | "ROUND_TRIP";
  segments: CreateBookingSegmentInput[];
};

function buildTicketEmail(booking: {
  referenceCode: string;
  ticketNumber: string;
  passengerName: string;
  passengerEmail: string;
  segments: Array<{
    flight: {
      flightNumber: string;
      departureAt: Date;
      origin: { code: string; city: string };
      destination: { code: string; city: string };
      airline: { name: string };
    };
  }>;
  totalPrice: number;
}) {
  const first = booking.segments[0].flight;
  return {
    recipient: booking.passengerEmail,
    subject: `E-Tiket ${booking.referenceCode} — ${first.origin.city} ke ${first.destination.city}`,
    body: [
      `Halo ${booking.passengerName},`,
      "",
      "E-tiket Anda telah diterbitkan. Detail perjalanan:",
      "",
      ...booking.segments.map((segment, index) => {
        const flight = segment.flight;
        return [
          `${index + 1}. ${flight.airline.name} ${flight.flightNumber}`,
          `   ${flight.origin.code} (${flight.origin.city}) → ${flight.destination.code} (${flight.destination.city})`,
          `   Keberangkatan: ${formatDateTime(flight.departureAt)} WIB`,
        ].join("\n");
      }),
      "",
      `Kode booking: ${booking.referenceCode}`,
      `Nomor tiket: ${booking.ticketNumber}`,
      `Total: ${formatIDR(booking.totalPrice)}`,
      "",
      "Tunjukkan e-tiket ini saat check-in. Terima kasih telah menggunakan TravelKu.",
    ].join("\n"),
  };
}

export async function createBooking(input: CreateBookingInput): Promise<BookingWithDetails> {
  if (input.segments.length === 0) {
    throw new BookingError("NO_SEGMENT", "Penerbangan belum dipilih");
  }
  if (input.tripType === "ONE_WAY" && input.segments.length !== 1) {
    throw new BookingError("INVALID_SEGMENTS", "Pemesanan sekali jalan harus memiliki satu penerbangan");
  }
  if (input.tripType === "ROUND_TRIP" && input.segments.length !== 2) {
    throw new BookingError("INVALID_SEGMENTS", "Pemesanan pulang-pergi harus memiliki dua penerbangan");
  }

  const uniqueFlightIds = new Set(input.segments.map((segment) => segment.flightId));
  if (uniqueFlightIds.size !== input.segments.length) {
    throw new BookingError("DUPLICATE_FLIGHT", "Penerbangan yang dipilih tidak boleh sama");
  }

  const passenger = await prisma.user.findUnique({
    where: { id: input.passengerId },
    include: { profile: true },
  });
  if (!passenger) throw new BookingError("PASSENGER_NOT_FOUND", "Data penumpang tidak ditemukan");

  const completeness = checkProfileCompleteness(passenger.profile);
  if (!completeness.complete) {
    throw new BookingError("PROFILE_INCOMPLETE", MESSAGES.PROFILE_INCOMPLETE);
  }

  const flights = await prisma.flight.findMany({
    where: { id: { in: [...uniqueFlightIds] } },
    include: { airline: true, origin: true, destination: true },
  });
  if (flights.length !== input.segments.length) {
    throw new BookingError("FLIGHT_NOT_FOUND", "Penerbangan tidak ditemukan");
  }

  const segments = input.segments.map((segment) => {
    const flight = flights.find((item) => item.id === segment.flightId);
    if (!flight) throw new BookingError("FLIGHT_NOT_FOUND", "Penerbangan tidak ditemukan");
    if (flight.seatsAvailable <= 0) {
      throw new BookingError("SEAT_UNAVAILABLE", "Kursi untuk penerbangan yang dipilih sudah habis");
    }
    if (new Date(flight.departureAt).getTime() <= Date.now()) {
      throw new BookingError("FLIGHT_DEPARTED", "Penerbangan yang dipilih sudah melewati jadwal keberangkatan");
    }
    return { ...segment, flight };
  });

  if (input.tripType === "ROUND_TRIP") {
    const outbound = segments.find((segment) => segment.leg === "OUTBOUND");
    const inbound = segments.find((segment) => segment.leg === "RETURN");
    if (!outbound || !inbound) {
      throw new BookingError("INVALID_SEGMENTS", "Rute pulang-pergi tidak lengkap");
    }
    if (
      outbound.flight.originId !== inbound.flight.destinationId ||
      outbound.flight.destinationId !== inbound.flight.originId
    ) {
      throw new BookingError(
        "INVALID_ROUTE",
        "Rute penerbangan kepulangan harus kebalikan dari rute keberangkatan",
      );
    }
    if (new Date(inbound.flight.departureAt) <= new Date(outbound.flight.arrivalAt)) {
      throw new BookingError(
        "INVALID_DATE",
        "Penerbangan kepulangan harus setelah penerbangan keberangkatan tiba",
      );
    }
  }

  const totalPrice = calculateTotalPrice(segments.map((segment) => segment.flight));
  const referenceCode = await createUniqueReference();
  const ticketNumber = await createUniqueTicketNumber();

  const booking = await prisma.$transaction(async (tx) => {
    for (const segment of segments) {
      const updated = await tx.flight.updateMany({
        where: { id: segment.flight.id, seatsAvailable: { gt: 0 } },
        data: { seatsAvailable: { decrement: 1 } },
      });
      if (updated.count === 0) {
        throw new BookingError("SEAT_UNAVAILABLE", "Kursi untuk penerbangan yang dipilih sudah habis");
      }
    }

    const created = await tx.booking.create({
      data: {
        referenceCode,
        bookerId: input.bookerId,
        passengerId: input.passengerId,
        status: "CONFIRMED",
        tripType: input.tripType,
        totalPrice,
        segments: {
          create: segments.map((segment) => ({
            flightId: segment.flight.id,
            leg: segment.leg,
            sequence: segment.sequence,
          })),
        },
        ticket: {
          create: {
            ticketNumber,
            validationStatus: "PENDING",
          },
        },
      },
    });

    const email = buildTicketEmail({
      referenceCode,
      ticketNumber,
      passengerName: passenger.name,
      passengerEmail: passenger.email,
      segments: segments.map((segment) => ({
        flight: {
          flightNumber: segment.flight.flightNumber,
          departureAt: segment.flight.departureAt,
          origin: { code: segment.flight.origin.code, city: segment.flight.origin.city },
          destination: {
            code: segment.flight.destination.code,
            city: segment.flight.destination.city,
          },
          airline: { name: segment.flight.airline.name },
        },
      })),
      totalPrice,
    });

    await tx.emailOutbox.create({
      data: {
        bookingId: created.id,
        recipient: email.recipient,
        subject: email.subject,
        body: email.body,
      },
    });

    return tx.booking.findUniqueOrThrow({
      where: { id: created.id },
      include: bookingInclude,
    });
  });

  return booking;
}

export async function cancelBooking(bookingId: string, userId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      segments: {
        include: { flight: true },
        orderBy: { sequence: "asc" },
      },
    },
  });
  if (!booking) throw new BookingError("NOT_FOUND", "Pemesanan tidak ditemukan");
  if (booking.bookerId !== userId && booking.passengerId !== userId) {
    throw new BookingError("FORBIDDEN", MESSAGES.UNAUTHORIZED);
  }
  if (booking.status === "CANCELLED") {
    throw new BookingError("ALREADY_CANCELLED", "Pemesanan ini sudah dibatalkan");
  }
  const earliestDeparture = booking.segments.reduce(
    (earliest, segment) =>
      new Date(segment.flight.departureAt) < earliest
        ? new Date(segment.flight.departureAt)
        : earliest,
    new Date(booking.segments[0]?.flight.departureAt ?? 0),
  );
  if (!canCancelBooking({ status: booking.status, departureAt: earliestDeparture })) {
    throw new BookingError(
      "CANCEL_NOT_ALLOWED",
      "Pemesanan tidak dapat dibatalkan karena jadwal keberangkatan sudah lewat",
    );
  }

  await prisma.$transaction(async (tx) => {
    const cancelled = await tx.booking.updateMany({
      where: { id: bookingId, status: { not: "CANCELLED" } },
      data: { status: "CANCELLED", cancelledAt: new Date() },
    });
    if (cancelled.count === 0) {
      throw new BookingError("ALREADY_CANCELLED", "Pemesanan ini sudah dibatalkan");
    }
    for (const segment of booking.segments) {
      await tx.flight.update({
        where: { id: segment.flightId },
        data: { seatsAvailable: { increment: 1 } },
      });
    }
  });

  return prisma.booking.findUniqueOrThrow({
    where: { id: bookingId },
    include: bookingInclude,
  });
}

export async function getBookingsForUser(userId: string) {
  return prisma.booking.findMany({
    where: {
      OR: [{ bookerId: userId }, { passengerId: userId }],
    },
    include: bookingInclude,
    orderBy: { createdAt: "desc" },
  });
}

export async function getBookingForUser(bookingId: string, userId: string) {
  return prisma.booking.findFirst({
    where: {
      id: bookingId,
      OR: [{ bookerId: userId }, { passengerId: userId }],
    },
    include: bookingInclude,
  });
}

export async function getBookingById(bookingId: string) {
  return prisma.booking.findUnique({
    where: { id: bookingId },
    include: bookingInclude,
  });
}

export async function getBookingByReference(reference: string) {
  const normalized = normalizeBookingReference(reference);
  if (!normalized) return null;
  return prisma.booking.findFirst({
    where: { referenceCode: normalized },
    include: bookingInclude,
  });
}

export type PassengerIdentityInput = {
  fullName: string;
  nik: string;
  phone: string;
  birthDate: Date;
  passportNumber?: string | null;
};

export async function updatePassengerProfile(userId: string, input: PassengerIdentityInput) {
  return prisma.$transaction(async (tx) => {
    const profile = await tx.passengerProfile.upsert({
      where: { userId },
      update: {
        fullName: input.fullName.trim(),
        nik: input.nik.trim(),
        phone: input.phone.trim(),
        birthDate: input.birthDate,
        ...(input.passportNumber !== undefined
          ? { passportNumber: input.passportNumber?.trim() || null }
          : {}),
      },
      create: {
        userId,
        fullName: input.fullName.trim(),
        nik: input.nik.trim(),
        phone: input.phone.trim(),
        birthDate: input.birthDate,
        passportNumber: input.passportNumber?.trim() || null,
      },
    });
    await tx.user.update({ where: { id: userId }, data: { name: input.fullName.trim() } });
    return profile;
  });
}

export async function getPassengerProfile(userId: string) {
  return prisma.passengerProfile.findUnique({ where: { userId } });
}
