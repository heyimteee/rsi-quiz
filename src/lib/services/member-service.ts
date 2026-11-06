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
    where: { passengerId: userId },
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

  if (result.status === "REJECTED") {
    await prisma.$transaction(async (tx) => {
      await tx.ticket.update({
        where: { id: booking.ticket!.id },
        data: { validationStatus: "REJECTED", validatedAt: new Date() },
      });
      await tx.ticketValidation.create({
        data: {
          ticketId: booking.ticket!.id,
          profileId: userId,
          status: "REJECTED",
          message: MESSAGES.PROFILE_INCOMPLETE,
        },
      });
    });
    return {
      status: "REJECTED" as const,
      message: MESSAGES.PROFILE_INCOMPLETE,
      alreadyValid: false,
      booking,
      missingLabels: result.missingLabels ?? [],
    };
  }

  await prisma.$transaction(async (tx) => {
    await tx.ticket.update({
      where: { id: booking.ticket!.id },
      data: { validationStatus: "VALID", validatedAt: new Date() },
    });
    await tx.ticketValidation.create({
      data: {
        ticketId: booking.ticket!.id,
        profileId: userId,
        status: "VALID",
        message: "Tiket berhasil divalidasi",
      },
    });
  });

  return {
    status: "VALID" as const,
    message: "Tiket berhasil divalidasi",
    alreadyValid: false,
    booking,
    missingLabels: [] as string[],
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
