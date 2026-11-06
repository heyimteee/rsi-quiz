import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/db";
import {
  getEmployeeLeaveHistory,
  getEmployeeSummaries,
  getLeaveDetail,
  getLeaveOverview,
} from "@/lib/services/leave-service";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/db", () => ({
  prisma: {
    employee: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
    leaveRequest: {
      findUnique: vi.fn(),
    },
  },
}));

const employeeFindMany = vi.mocked(prisma.employee.findMany);
const employeeFindUnique = vi.mocked(prisma.employee.findUnique);
const leaveFindUnique = vi.mocked(prisma.leaveRequest.findUnique);

function makeEmployee(overrides: Record<string, unknown> = {}) {
  return {
    id: "emp-1",
    userId: null,
    name: "Andi Saputra",
    nip: "198501012010011001",
    department: "Keuangan",
    email: "andi@company.test",
    annualQuota: 12,
    createdAt: new Date(2026, 0, 1),
    leave: [],
    ...overrides,
  };
}

function makeLeave(overrides: Record<string, unknown> = {}) {
  return {
    id: "leave-1",
    employeeId: "emp-1",
    startDate: new Date(2026, 0, 5),
    endDate: new Date(2026, 0, 7),
    reason: "Liburan",
    status: "APPROVED",
    requestedAt: new Date(2026, 0, 1),
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getLeaveOverview", () => {
  it("menggabungkan pengajuan beberapa pegawai dan menghitung durasi", async () => {
    const leaveA = makeLeave({
      id: "a",
      startDate: new Date(2026, 0, 30),
      endDate: new Date(2026, 1, 3),
    });
    const leaveB = makeLeave({
      id: "b",
      employeeId: "emp-2",
      startDate: new Date(2026, 1, 10),
      endDate: new Date(2026, 1, 11),
      status: "PENDING",
    });
    employeeFindMany.mockResolvedValue([
      makeEmployee({ id: "emp-1", leave: [leaveA] }),
      makeEmployee({ id: "emp-2", name: "Bunga Lestari", leave: [leaveB] }),
    ] as never);

    const result = await getLeaveOverview({ month: 2, year: 2026 });

    expect(result.employeeCount).toBe(2);
    expect(result.rows).toHaveLength(2);
    expect(result.rows[0].duration).toBe(5);
    expect(result.rows[1].duration).toBe(2);
    expect(result.summary).toEqual({ total: 2, approved: 1, pending: 1, rejected: 0 });
  });

  it("mengembalikan hasil kosong jika tidak ada pengajuan pada periode", async () => {
    employeeFindMany.mockResolvedValue([makeEmployee({ leave: [] })] as never);
    const result = await getLeaveOverview({ month: 6, year: 2026 });
    expect(result.rows).toHaveLength(0);
    expect(result.employeeCount).toBe(0);
  });
});

describe("getEmployeeSummaries", () => {
  it("menghitung sisa cuti tahun berjalan dan pengajuan terbaru", async () => {
    const year = new Date().getFullYear();
    const approved = makeLeave({
      id: "a",
      startDate: new Date(year, 0, 5),
      endDate: new Date(year, 0, 7),
      status: "APPROVED",
    });
    const pending = makeLeave({
      id: "b",
      startDate: new Date(year, 2, 5),
      endDate: new Date(year, 2, 6),
      status: "PENDING",
    });
    employeeFindMany.mockResolvedValue([
      makeEmployee({ id: "emp-1", leave: [approved, pending] }),
    ] as never);

    const result = await getEmployeeSummaries();
    expect(result).toHaveLength(1);
    expect(result[0].used).toBe(3);
    expect(result[0].remaining).toBe(9);
    expect(result[0].totalRequests).toBe(2);
    expect(result[0].lastLeave?.id).toBe("b");
  });
});

describe("getEmployeeLeaveHistory", () => {
  it("menyusun rekap per tahun dan riwayat berdurasi", async () => {
    const currentYear = new Date().getFullYear();
    const current = makeLeave({
      id: "current",
      startDate: new Date(currentYear, 1, 3),
      endDate: new Date(currentYear, 1, 5),
    });
    const previous = makeLeave({
      id: "previous",
      startDate: new Date(currentYear - 1, 5, 3),
      endDate: new Date(currentYear - 1, 5, 4),
    });
    employeeFindUnique.mockResolvedValue(
      makeEmployee({ leave: [current, previous] }) as never,
    );

    const result = await getEmployeeLeaveHistory("emp-1");
    expect(result).not.toBeNull();
    expect(result?.currentQuota.used).toBe(3);
    expect(result?.quotaByYear.map((item) => item.year)).toEqual(
      expect.arrayContaining([currentYear, currentYear - 1]),
    );
    expect(result?.history[0].duration).toBe(3);
    expect(result?.history[1].duration).toBe(2);
  });

  it("mengembalikan null untuk pegawai yang tidak ada", async () => {
    employeeFindUnique.mockResolvedValue(null);
    expect(await getEmployeeLeaveHistory("missing")).toBeNull();
  });
});

describe("getLeaveDetail", () => {
  it("menghitung durasi, sisa cuti, dan pembagian lintas tahun", async () => {
    const currentYear = new Date().getFullYear();
    const request = makeLeave({
      id: "detail",
      startDate: new Date(currentYear, 11, 28),
      endDate: new Date(currentYear + 1, 0, 3),
    });
    leaveFindUnique.mockResolvedValue({
      ...request,
      employee: makeEmployee({ leave: [request] }),
    } as never);

    const result = await getLeaveDetail("detail");
    expect(result?.duration).toBe(7);
    expect(result?.yearBreakdown).toEqual([
      { year: currentYear, days: 4 },
      { year: currentYear + 1, days: 3 },
    ]);
    expect(result?.quota.used).toBe(4);
  });

  it("mengembalikan null untuk pengajuan yang tidak ada", async () => {
    leaveFindUnique.mockResolvedValue(null);
    expect(await getLeaveDetail("missing")).toBeNull();
  });
});
