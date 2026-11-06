import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/db";
import {
  getAllBookings,
  getEmailOutbox,
  getVisitorById,
  getVisitors,
} from "@/lib/services/travel-service";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/db", () => ({
  prisma: {
    booking: { findMany: vi.fn() },
    user: { findMany: vi.fn(), findFirst: vi.fn() },
    emailOutbox: { findMany: vi.fn() },
  },
}));

const bookingFindMany = vi.mocked(prisma.booking.findMany);
const userFindMany = vi.mocked(prisma.user.findMany);
const userFindFirst = vi.mocked(prisma.user.findFirst);
const emailFindMany = vi.mocked(prisma.emailOutbox.findMany);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getAllBookings", () => {
  it("mengambil semua pemesanan terbaru", async () => {
    bookingFindMany.mockResolvedValue([{ id: "booking-1" }] as never);
    const result = await getAllBookings();
    expect(result).toHaveLength(1);
    expect(bookingFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { createdAt: "desc" } }),
    );
  });
});

describe("getVisitors", () => {
  it("mengambil pengunjung tanpa filter", async () => {
    userFindMany.mockResolvedValue([{ id: "visitor-1" }] as never);
    await getVisitors();
    expect(userFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { role: "VISITOR" } }),
    );
  });

  it("mencari pengunjung berdasarkan nama, email, atau NIK", async () => {
    userFindMany.mockResolvedValue([{ id: "visitor-1" }] as never);
    await getVisitors("  siti ");
    const call = userFindMany.mock.calls[0][0] as {
      where: { OR: Array<Record<string, unknown>> };
    };
    expect(call.where.OR).toHaveLength(3);
    expect(call.where.OR[0]).toEqual({ name: { contains: "siti" } });
  });

  it("mengambil pengunjung berdasarkan id", async () => {
    userFindFirst.mockResolvedValue({ id: "visitor-1" } as never);
    const result = await getVisitorById("visitor-1");
    expect(result?.id).toBe("visitor-1");
    expect(userFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "visitor-1", role: "VISITOR" } }),
    );
  });
});

describe("getEmailOutbox", () => {
  it("mengambil email terbaru", async () => {
    emailFindMany.mockResolvedValue([{ id: "email-1" }] as never);
    const result = await getEmailOutbox(10);
    expect(result).toHaveLength(1);
    expect(emailFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 10, orderBy: { sentAt: "desc" } }),
    );
  });
});
