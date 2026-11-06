import "server-only";

import type { Employee, LeaveRequest } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  calculateLeaveDuration,
  calculateRemainingLeave,
  clipLeaveDurationToYear,
  filterLeaveRequests,
  getLeaveYears,
  summarizeLeaveByStatus,
  type LeavePeriod,
} from "@/lib/domain/leave";

export type LeaveRow = LeaveRequest & {
  employee: Employee;
  duration: number;
};

export type LeaveOverview = {
  rows: LeaveRow[];
  employeeCount: number;
  summary: ReturnType<typeof summarizeLeaveByStatus>;
};

export async function getLeaveOverview(period: LeavePeriod): Promise<LeaveOverview> {
  const employees = await prisma.employee.findMany({
    include: { leave: { orderBy: { startDate: "asc" } } },
    orderBy: { name: "asc" },
  });

  const rows: LeaveRow[] = [];
  for (const employee of employees) {
    const matching = filterLeaveRequests(employee.leave, period);
    for (const request of matching) {
      rows.push({
        ...request,
        employee,
        duration: calculateLeaveDuration(request.startDate, request.endDate),
      });
    }
  }

  rows.sort((a, b) => {
    const byStart = new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
    if (byStart !== 0) return byStart;
    return a.employee.name.localeCompare(b.employee.name);
  });

  return {
    rows,
    employeeCount: new Set(rows.map((row) => row.employeeId)).size,
    summary: summarizeLeaveByStatus(rows),
  };
}

export async function getLeaveDetail(id: string) {
  const leave = await prisma.leaveRequest.findUnique({
    where: { id },
    include: {
      employee: {
        include: { leave: { orderBy: { startDate: "asc" } } },
      },
    },
  });
  if (!leave) return null;

  const currentYear = new Date().getFullYear();
  const quota = calculateRemainingLeave(
    leave.employee.annualQuota,
    leave.employee.leave,
    currentYear,
  );

  const startYear = new Date(leave.startDate).getFullYear();
  const endYear = new Date(leave.endDate).getFullYear();
  const yearBreakdown = [];
  for (let year = startYear; year <= endYear; year++) {
    yearBreakdown.push({
      year,
      days: clipLeaveDurationToYear(leave.startDate, leave.endDate, year),
    });
  }

  return {
    ...leave,
    duration: calculateLeaveDuration(leave.startDate, leave.endDate),
    quota,
    yearBreakdown,
  };
}

export type EmployeeSummary = {
  employee: Employee;
  quota: number;
  used: number;
  remaining: number;
  totalRequests: number;
  lastLeave: LeaveRequest | null;
};

export async function getEmployeeSummaries(): Promise<EmployeeSummary[]> {
  const year = new Date().getFullYear();
  const employees = await prisma.employee.findMany({
    include: {
      leave: {
        orderBy: { startDate: "desc" },
      },
    },
    orderBy: { name: "asc" },
  });

  return employees.map((employee) => {
    const balance = calculateRemainingLeave(employee.annualQuota, employee.leave, year);
    return {
      employee,
      quota: balance.quota,
      used: balance.used,
      remaining: balance.remaining,
      totalRequests: employee.leave.length,
      lastLeave:
        [...employee.leave].sort(
          (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime(),
        )[0] ?? null,
    };
  });
}

export async function getEmployeeLeaveHistory(employeeId: string) {
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    include: {
      leave: { orderBy: { startDate: "desc" } },
    },
  });
  if (!employee) return null;

  const years = getLeaveYears(employee.leave);
  const currentYear = new Date().getFullYear();
  const allYears = Array.from(new Set([...years, currentYear])).sort((a, b) => b - a);
  const quotaByYear = allYears.map((year) => ({
    year,
    ...calculateRemainingLeave(employee.annualQuota, employee.leave, year),
  }));

  return {
    employee,
    years,
    currentYear,
    currentQuota: calculateRemainingLeave(employee.annualQuota, employee.leave, currentYear),
    quotaByYear,
    history: employee.leave.map((request) => ({
      ...request,
      duration: calculateLeaveDuration(request.startDate, request.endDate),
      yearLabel:
        new Date(request.startDate).getFullYear() === new Date(request.endDate).getFullYear()
          ? String(new Date(request.startDate).getFullYear())
          : `${new Date(request.startDate).getFullYear()}–${new Date(request.endDate).getFullYear()}`,
    })),
  };
}
