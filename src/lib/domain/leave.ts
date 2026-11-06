import { differenceInCalendarDays, endOfDay, startOfDay } from "date-fns";

export type LeaveRequestLike = {
  id: string;
  employeeId: string;
  startDate: Date;
  endDate: Date;
  reason: string;
  status: string;
  requestedAt: Date;
};

export type LeavePeriod = {
  /** Optional exact day (1-31). When omitted, the whole month is used. */
  day?: number | null;
  /** 1-12 */
  month: number;
  year: number;
};

export function calculateLeaveDuration(start: Date | string, end: Date | string): number {
  const startDate = new Date(start);
  const endDate = new Date(end);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return 0;
  const diff = differenceInCalendarDays(startOfDay(endDate), startOfDay(startDate));
  if (diff < 0) return 0;
  return diff + 1;
}

export function clipLeaveDurationToYear(
  start: Date | string,
  end: Date | string,
  year: number,
): number {
  const requestStart = startOfDay(new Date(start));
  const requestEnd = startOfDay(new Date(end));
  if (Number.isNaN(requestStart.getTime()) || Number.isNaN(requestEnd.getTime())) return 0;
  if (requestEnd < requestStart) return 0;

  const yearStart = new Date(year, 0, 1);
  const yearEnd = new Date(year, 11, 31);
  const clippedStart = requestStart > yearStart ? requestStart : yearStart;
  const clippedEnd = requestEnd < yearEnd ? requestEnd : yearEnd;
  if (clippedEnd < clippedStart) return 0;
  return differenceInCalendarDays(clippedEnd, clippedStart) + 1;
}

export function calculateRemainingLeave(
  quota: number,
  requests: LeaveRequestLike[],
  year: number,
): { used: number; remaining: number; quota: number } {
  const safeQuota = Number.isFinite(quota) && quota >= 0 ? Math.floor(quota) : 0;
  const used = requests
    .filter((request) => request.status.toUpperCase() === "APPROVED")
    .reduce((sum, request) => sum + clipLeaveDurationToYear(request.startDate, request.endDate, year), 0);
  return {
    quota: safeQuota,
    used,
    remaining: Math.max(0, safeQuota - used),
  };
}

export function leavePeriodRange(period: LeavePeriod): { start: Date; end: Date } | null {
  if (!Number.isInteger(period.year) || period.year < 1900) return null;
  if (!Number.isInteger(period.month) || period.month < 1 || period.month > 12) return null;

  if (period.day !== undefined && period.day !== null) {
    if (!Number.isInteger(period.day) || period.day < 1 || period.day > 31) return null;
    const start = new Date(period.year, period.month - 1, period.day, 0, 0, 0, 0);
    if (start.getMonth() !== period.month - 1) return null;
    return { start, end: endOfDay(start) };
  }

  const start = new Date(period.year, period.month - 1, 1, 0, 0, 0, 0);
  const end = endOfDay(new Date(period.year, period.month, 0, 0, 0, 0, 0));
  return { start, end };
}

export function isLeaveOverlappingPeriod(request: LeaveRequestLike, period: LeavePeriod): boolean {
  const range = leavePeriodRange(period);
  if (!range) return false;
  const requestStart = startOfDay(new Date(request.startDate));
  const requestEnd = startOfDay(new Date(request.endDate));
  if (requestEnd < requestStart) return false;
  return requestStart <= range.end && requestEnd >= range.start;
}

export function filterLeaveRequests(
  requests: LeaveRequestLike[],
  period: LeavePeriod,
): LeaveRequestLike[] {
  return requests
    .filter((request) => isLeaveOverlappingPeriod(request, period))
    .sort((a, b) => {
      const byStart = new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
      if (byStart !== 0) return byStart;
      return a.employeeId.localeCompare(b.employeeId);
    });
}

export function getLeaveYears(requests: LeaveRequestLike[]): number[] {
  const years = new Set<number>();
  for (const request of requests) {
    const startYear = new Date(request.startDate).getFullYear();
    const endYear = new Date(request.endDate).getFullYear();
    for (let year = startYear; year <= endYear; year++) years.add(year);
  }
  return Array.from(years).sort((a, b) => b - a);
}

export function summarizeLeaveByStatus(requests: LeaveRequestLike[]) {
  return requests.reduce(
    (summary, request) => {
      const status = request.status.toUpperCase();
      if (status === "APPROVED") summary.approved += 1;
      else if (status === "PENDING") summary.pending += 1;
      else if (status === "REJECTED") summary.rejected += 1;
      summary.total += 1;
      return summary;
    },
    { total: 0, approved: 0, pending: 0, rejected: 0 },
  );
}
