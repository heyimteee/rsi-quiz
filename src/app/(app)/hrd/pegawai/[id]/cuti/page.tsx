import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  BadgeCheck,
  CalendarDays,
  CalendarRange,
  Mail,
  RotateCcw,
  UserRound,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { SubmitButton } from "@/components/ui/submit-button";
import { getEmployeeLeaveHistory } from "@/lib/services/leave-service";
import { clipLeaveDurationToYear } from "@/lib/domain/leave";
import { firstParam, formatDate, formatDateTime, initials } from "@/lib/utils";

export const metadata: Metadata = { title: "Riwayat Cuti Pegawai" };

type Params = Promise<{ id: string }>;
type SearchParams = Promise<{ tahun?: string | string[] }>;

export default async function EmployeeLeaveHistoryPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { id } = await params;
  const query = await searchParams;
  const data = await getEmployeeLeaveHistory(id);
  if (!data) notFound();

  const selectedYearRaw = firstParam(query.tahun);
  const selectedYear = selectedYearRaw ? Number.parseInt(selectedYearRaw, 10) : null;
  const yearFilter = Number.isFinite(selectedYear) ? selectedYear : null;

  const filteredHistory = yearFilter
    ? data.history.filter((request) => {
        const startYear = new Date(request.startDate).getFullYear();
        const endYear = new Date(request.endDate).getFullYear();
        return startYear <= yearFilter && endYear >= yearFilter;
      })
    : data.history;

  const yearOptions = Array.from(new Set([...data.years, data.currentYear])).sort((a, b) => b - a);

  return (
    <div className="space-y-6">
      <Link
        href="/hrd/pegawai"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-ink"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Kembali ke daftar pegawai
      </Link>

      <PageHeader
        eyebrow="Studi Kasus 01 · Riwayat Pegawai"
        title={data.employee.name}
        description={`Riwayat cuti dan sisa hak cuti tahun ${data.currentYear}. NIP ${data.employee.nip} · ${data.employee.department}`}
        actions={
          <Link href={`/hrd/cuti?bulan=${new Date().getMonth() + 1}&tahun=${data.currentYear}`} className="btn-secondary">
            <CalendarDays className="size-4" aria-hidden />
            Daftar Pengajuan
          </Link>
        }
      />

      <section className="card p-5" aria-label="Identitas pegawai">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-sky-soft text-sm font-bold text-sky">
              {initials(data.employee.name)}
            </span>
            <div>
              <p className="font-bold">{data.employee.name}</p>
              <p className="text-xs text-muted">NIP {data.employee.nip}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-muted">
            <span className="flex items-center gap-1.5">
              <UserRound className="size-4" aria-hidden />
              {data.employee.department}
            </span>
            <span className="flex items-center gap-1.5">
              <Mail className="size-4" aria-hidden />
              {data.employee.email}
            </span>
            <span className="flex items-center gap-1.5">
              <BadgeCheck className="size-4" aria-hidden />
              Kuota {data.employee.annualQuota} hari/tahun
            </span>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Hak cuti tahun berjalan">
        <StatCard label={`Kuota ${data.currentYear}`} value={`${data.currentQuota.quota} hari`} icon={CalendarRange} tone="sky" />
        <StatCard label="Terpakai tahun ini" value={`${data.currentQuota.used} hari`} icon={CalendarDays} tone="amber" />
        <StatCard
          label="Sisa tahun berjalan"
          value={`${data.currentQuota.remaining} hari`}
          icon={BadgeCheck}
          tone="green"
        />
        <StatCard label="Total riwayat" value={`${data.history.length} pengajuan`} icon={CalendarRange} />
      </section>

      <section className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="section-title">Rekap hak cuti per tahun</h2>
            <p className="text-sm text-muted">Perhitungan dipotong sesuai tahun kalender.</p>
          </div>
        </div>
        <div className="table-wrap">
          <table className="data-table">
            <caption className="sr-only">Rekap kuota, cuti terpakai, dan sisa per tahun</caption>
            <thead>
              <tr>
                <th scope="col">Tahun</th>
                <th scope="col">Kuota</th>
                <th scope="col">Terpakai</th>
                <th scope="col">Sisa</th>
              </tr>
            </thead>
            <tbody>
              {data.quotaByYear.map((item) => (
                <tr key={item.year}>
                  <td className="font-semibold">{item.year}</td>
                  <td>{item.quota} hari</td>
                  <td>{item.used} hari</td>
                  <td>
                    <span className="badge bg-green-soft text-emerald-800">{item.remaining} hari</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="section-title">Riwayat pengajuan cuti</h2>
            <p className="text-sm text-muted">
              {filteredHistory.length} pengajuan
              {yearFilter ? ` pada tahun ${yearFilter}` : " dari seluruh tahun"}.
            </p>
          </div>
          <form method="get" className="flex items-end gap-2">
            <div>
              <label htmlFor="tahun" className="label">
                Filter tahun
              </label>
              <select
                id="tahun"
                name="tahun"
                defaultValue={yearFilter ? String(yearFilter) : ""}
                className="input min-w-40"
              >
                <option value="">Semua tahun</option>
                {yearOptions.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
            <SubmitButton variant="secondary">Terapkan</SubmitButton>
            {yearFilter ? (
              <Link href={`/hrd/pegawai/${id}/cuti`} className="btn-ghost" title="Reset filter tahun">
                <RotateCcw className="size-4" aria-hidden />
                <span className="sr-only">Reset</span>
              </Link>
            ) : null}
          </form>
        </div>

        {filteredHistory.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title="Belum ada riwayat cuti"
            description={
              yearFilter
                ? `Tidak ada pengajuan cuti pada tahun ${yearFilter}.`
                : "Pegawai ini belum pernah mengajukan cuti."
            }
          />
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <caption className="sr-only">Riwayat cuti pegawai</caption>
              <thead>
                <tr>
                  <th scope="col">Periode</th>
                  <th scope="col">Durasi</th>
                  <th scope="col">Tahun</th>
                  <th scope="col">Alasan</th>
                  <th scope="col">Status</th>
                  <th scope="col">Diajukan</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.map((request) => {
                  const yearSplit = (() => {
                    const startYear = new Date(request.startDate).getFullYear();
                    const endYear = new Date(request.endDate).getFullYear();
                    if (startYear === endYear) return null;
                    const parts = [];
                    for (let year = startYear; year <= endYear; year++) {
                      parts.push(`${year}: ${clipLeaveDurationToYear(request.startDate, request.endDate, year)} hari`);
                    }
                    return parts.join(" · ");
                  })();

                  return (
                    <tr key={request.id} data-testid="history-row">
                      <td className="whitespace-nowrap">
                        {formatDate(request.startDate)} – {formatDate(request.endDate)}
                      </td>
                      <td>
                        <span className="font-semibold">{request.duration}</span>{" "}
                        <span className="text-xs text-muted">hari</span>
                      </td>
                      <td>
                        <span className="badge bg-canvas text-muted">{request.yearLabel}</span>
                        {yearSplit ? <p className="mt-1 text-[10px] text-muted">{yearSplit}</p> : null}
                      </td>
                      <td className="max-w-56 truncate text-muted" title={request.reason}>
                        {request.reason}
                      </td>
                      <td>
                        <StatusBadge status={request.status} kind="leave" />
                      </td>
                      <td className="whitespace-nowrap text-xs text-muted">
                        {formatDateTime(request.requestedAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
