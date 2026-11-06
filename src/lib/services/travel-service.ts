import "server-only";

import { prisma } from "@/lib/db";
import { bookingInclude } from "@/lib/services/booking-service";

export async function getAllBookings() {
  return prisma.booking.findMany({
    include: bookingInclude,
    orderBy: { createdAt: "desc" },
  });
}

export async function getVisitors(query?: string) {
  const search = query?.trim();
  return prisma.user.findMany({
    where: {
      role: "VISITOR",
      ...(search
        ? {
            OR: [
              { name: { contains: search } },
              { email: { contains: search } },
              { profile: { nik: { contains: search } } },
            ],
          }
        : {}),
    },
    include: { profile: true },
    orderBy: { name: "asc" },
  });
}

export async function getVisitorById(id: string) {
  return prisma.user.findFirst({
    where: { id, role: "VISITOR" },
    include: { profile: true },
  });
}

export async function getEmailOutbox(limit = 100) {
  return prisma.emailOutbox.findMany({
    include: {
      booking: {
        include: {
          passenger: { select: { id: true, name: true, email: true } },
          segments: {
            include: {
              flight: { include: { airline: true, origin: true, destination: true } },
            },
            orderBy: { sequence: "asc" },
          },
        },
      },
    },
    orderBy: { sentAt: "desc" },
    take: limit,
  });
}
