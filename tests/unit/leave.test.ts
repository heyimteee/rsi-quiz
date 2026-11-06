import { describe, expect, it } from "vitest";
import {
  calculateLeaveDuration,
  calculateRemainingLeave,
  clipLeaveDurationToYear,
  filterLeaveRequests,
  getLeaveYears,
  isLeaveOverlappingPeriod,
  summarizeLeaveByStatus,
  type LeaveRequestLike,
} from "@/lib/domain/leave";

function leave(
  id: string,
  start: Date,
  end: Date,
  status = "APPROVED",
): LeaveRequestLike {
  return {
    id,
    employeeId: "emp-1",
    startDate: start,
    endDate: end,
    reason: "Liburan",
    status,
    requestedAt: new Date(2026, 0, 1),
  };
}

describe("calculateLeaveDuration", () => {
  it("menghitung satu hari untuk tanggal yang sama", () => {
    expect(calculateLeaveDuration(new Date(2026, 0, 5), new Date(2026, 0, 5))).toBe(1);
  });

  it("menghitung durasi inklusif", () => {
    expect(calculateLeaveDuration(new Date(2026, 0, 5), new Date(2026, 0, 7))).toBe(3);
  });

  it("mengembalikan 0 untuk tanggal terbalik", () => {
    expect(calculateLeaveDuration(new Date(2026, 0, 7), new Date(2026, 0, 5))).toBe(0);
  });

  it("mengembalikan 0 untuk tanggal tidak valid", () => {
    expect(calculateLeaveDuration(new Date("invalid"), new Date(2026, 0, 5))).toBe(0);
  });
});

describe("clipLeaveDurationToYear", () => {
  it("memotong cuti lintas tahun sesuai tahun berjalan", () => {
    const start = new Date(2026, 11, 28);
    const end = new Date(2027, 0, 3);
    expect(clipLeaveDurationToYear(start, end, 2026)).toBe(4);
    expect(clipLeaveDurationToYear(start, end, 2027)).toBe(3);
  });

  it("mengembalikan 0 jika cuti di luar tahun", () => {
    expect(clipLeaveDurationToYear(new Date(2027, 5, 1), new Date(2027, 5, 2), 2026)).toBe(0);
  });
});

describe("calculateRemainingLeave", () => {
  it("hanya menghitung pengajuan disetujui", () => {
    const requests = [
      leave("1", new Date(2026, 0, 5), new Date(2026, 0, 7), "APPROVED"),
      leave("2", new Date(2026, 1, 5), new Date(2026, 1, 6), "PENDING"),
      leave("3", new Date(2026, 2, 5), new Date(2026, 2, 6), "REJECTED"),
    ];
    expect(calculateRemainingLeave(12, requests, 2026)).toEqual({
      quota: 12,
      used: 3,
      remaining: 9,
    });
  });

  it("tidak pernah menghasilkan sisa negatif", () => {
    const requests = [leave("1", new Date(2026, 0, 1), new Date(2026, 0, 20), "APPROVED")];
    expect(calculateRemainingLeave(12, requests, 2026).remaining).toBe(0);
  });

  it("menangani kuota tidak valid", () => {
    expect(calculateRemainingLeave(Number.NaN, [], 2026)).toEqual({
      quota: 0,
      used: 0,
      remaining: 0,
    });
  });
});

describe("filterLeaveRequests", () => {
  const requests = [
    leave("a", new Date(2026, 0, 30), new Date(2026, 1, 3)),
    leave("b", new Date(2026, 1, 10), new Date(2026, 1, 11)),
    leave("c", new Date(2026, 2, 1), new Date(2026, 2, 1)),
  ];

  it("menyertakan pengajuan yang beririsan dengan bulan yang dipilih", () => {
    const result = filterLeaveRequests(requests, { month: 2, year: 2026 });
    expect(result.map((item) => item.id)).toEqual(["a", "b"]);
  });

  it("memfilter berdasarkan tanggal spesifik", () => {
    const result = filterLeaveRequests(requests, { day: 1, month: 2, year: 2026 });
    expect(result.map((item) => item.id)).toEqual(["a"]);
  });

  it("menghasilkan kosong untuk periode tanpa pengajuan", () => {
    expect(filterLeaveRequests(requests, { month: 5, year: 2026 })).toHaveLength(0);
  });

  it("mengembalikan false untuk periode tidak valid", () => {
    expect(isLeaveOverlappingPeriod(requests[0], { month: 13, year: 2026 })).toBe(false);
    expect(isLeaveOverlappingPeriod(requests[0], { day: 31, month: 2, year: 2026 })).toBe(false);
  });
});

describe("leave helpers", () => {
  it("mengumpulkan tahun unik dari riwayat", () => {
    const requests = [
      leave("a", new Date(2025, 11, 28), new Date(2026, 0, 3)),
      leave("b", new Date(2024, 5, 1), new Date(2024, 5, 2)),
    ];
    expect(getLeaveYears(requests)).toEqual([2026, 2025, 2024]);
  });

  it("meringkas status pengajuan", () => {
    const requests = [
      leave("a", new Date(2026, 0, 1), new Date(2026, 0, 2), "APPROVED"),
      leave("b", new Date(2026, 0, 3), new Date(2026, 0, 4), "PENDING"),
      leave("c", new Date(2026, 0, 5), new Date(2026, 0, 6), "REJECTED"),
    ];
    expect(summarizeLeaveByStatus(requests)).toEqual({
      total: 3,
      approved: 1,
      pending: 1,
      rejected: 1,
    });
  });
});
