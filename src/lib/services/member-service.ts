import "server-only";

import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { validateTicket as validateTicketDomain } from "@/lib/domain/profile";
import { MESSAGES } from "@/lib/constants";

export const memberTicketInclude = {
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
  passenger: { include: { profile: true } },
} satisfies Prisma.BookingInclude;

export type MemberTicket = Prisma.BookingGetPayload<{ include: typeof memberTicketInclude }>;

export class MemberError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "MemberError";
    this.code = code;
  }
}

export async function getMemberTickets(userId: string) {
  return prisma.booking.findMany({
    where: { passengerId: userId, status: { not: "CANCELLED" } },
    include: memberTicketInclude,
    orderBy: { createdAt: "desc" },
  });
}

export async function validateMemberTicket(userId: string, bookingId: string) {
  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, passengerId: userId },
    include: memberTicketInclude,
  });

  if (!booking) {
    throw new MemberError("TICKET_NOT_FOUND", "Tiket tidak ditemukan");
  }
  if (!booking.ticket) {
    throw new MemberError("TICKET_NOT_FOUND", "Tiket tidak ditemukan");
  }
  if (booking.status === "CANCELLED") {
    throw new MemberError(
      "TICKET_CANCELLED",
      "Tiket tidak dapat divalidasi karena pemesanan telah dibatalkan",
    );
  }
  if (booking.ticket.validationStatus === "VALID") {
    return {
      status: "VALID" as const,
      message: "Tiket sudah tervalidasi",
      alreadyValid: true,
      booking,
      missingLabels: [] as string[],
    };
  }

  const result = validateTicketDomain(booking.passenger.profile, true);
  const nextStatus = result.status;
  const message = result.status === "REJECTED" ? MESSAGES.PROFILE_INCOMPLETE : "Tiket berhasil divalidasi";

  const transition = await prisma.$transaction(async (tx) => {
    const updated = await tx.ticket.updateMany({
      where: { id: booking.ticket!.id, validationStatus: { not: "VALID" } },
      data: { validationStatus: nextStatus, validatedAt: new Date() },
    });
    if (updated.count === 0) return { alreadyValid: true };
    await tx.ticketValidation.create({
      data: {
        ticketId: booking.ticket!.id,
        profileId: userId,
        status: nextStatus,
        message,
      },
    });
    return { alreadyValid: false };
  });

  if (transition.alreadyValid) {
    return {
      status: "VALID" as const,
      message: "Tiket sudah tervalidasi",
      alreadyValid: true,
      booking,
      missingLabels: [] as string[],
    };
  }

  return {
    status: nextStatus,
    message,
    alreadyValid: false,
    booking,
    missingLabels: result.missingLabels ?? [],
  };
}

export async function getValidationHistory(userId: string, limit = 8) {
  return prisma.ticketValidation.findMany({
    where: { profileId: userId },
    include: {
      ticket: {
        include: {
          booking: {
            include: {
              segments: {
                include: {
                  flight: { include: { airline: true, origin: true, destination: true } },
                },
                orderBy: { sequence: "asc" },
              },
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
