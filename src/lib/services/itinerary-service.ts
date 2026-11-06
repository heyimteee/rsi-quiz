import "server-only";

import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

export const itineraryInclude = {
  segments: {
    include: { origin: true, destination: true },
    orderBy: { sequence: "asc" as const },
  },
} satisfies Prisma.ItineraryInclude;

export type ItineraryWithSegments = Prisma.ItineraryGetPayload<{
  include: typeof itineraryInclude;
}>;

export class ItineraryError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "ItineraryError";
    this.code = code;
  }
}

export async function getItineraries(memberId: string) {
  return prisma.itinerary.findMany({
    where: { memberId },
    include: itineraryInclude,
    orderBy: { createdAt: "desc" },
  });
}

export async function getItinerary(id: string, memberId: string) {
  return prisma.itinerary.findFirst({
    where: { id, memberId },
    include: itineraryInclude,
  });
}

export type ItinerarySegmentInput = {
  originId: string;
  destinationId: string;
  departureDate: Date;
};

export async function createItinerary(
  memberId: string,
  name: string,
  segments: ItinerarySegmentInput[],
) {
  if (!name.trim()) throw new ItineraryError("INVALID_NAME", "Nama rencana perjalanan wajib diisi");
  if (segments.length === 0) throw new ItineraryError("NO_SEGMENT", "Tambahkan minimal satu rute");
  for (let index = 0; index < segments.length; index++) {
    const segment = segments[index];
    if (segment.originId === segment.destinationId) {
      throw new ItineraryError("INVALID_ROUTE", "Kota asal dan tujuan tidak boleh sama");
    }
    if (index > 0 && segment.departureDate < segments[index - 1].departureDate) {
      throw new ItineraryError(
        "INVALID_DATE",
        "Tanggal rute lanjutan tidak boleh lebih awal daripada rute sebelumnya",
      );
    }
  }

  return prisma.itinerary.create({
    data: {
      memberId,
      name: name.trim(),
      segments: {
        create: segments.map((segment, index) => ({
          originId: segment.originId,
          destinationId: segment.destinationId,
          departureDate: segment.departureDate,
          sequence: index + 1,
        })),
      },
    },
    include: itineraryInclude,
  });
}

export async function addItinerarySegment(
  itineraryId: string,
  memberId: string,
  segment: ItinerarySegmentInput,
) {
  const itinerary = await prisma.itinerary.findFirst({
    where: { id: itineraryId, memberId },
    include: itineraryInclude,
  });
  if (!itinerary) throw new ItineraryError("NOT_FOUND", "Rencana perjalanan tidak ditemukan");
  if (itinerary.segments.length >= 4) {
    throw new ItineraryError("MAX_SEGMENTS", "Rencana perjalanan maksimal memiliki 4 rute");
  }
  if (segment.originId === segment.destinationId) {
    throw new ItineraryError("INVALID_ROUTE", "Kota asal dan tujuan tidak boleh sama");
  }
  const previous = itinerary.segments[itinerary.segments.length - 1];
  if (previous && segment.departureDate < new Date(previous.departureDate)) {
    throw new ItineraryError(
      "INVALID_DATE",
      "Tanggal rute lanjutan tidak boleh lebih awal daripada rute sebelumnya",
    );
  }

  return prisma.itinerarySegment.create({
    data: {
      itineraryId,
      originId: segment.originId,
      destinationId: segment.destinationId,
      departureDate: segment.departureDate,
      sequence: (previous?.sequence ?? 0) + 1,
    },
  });
}
