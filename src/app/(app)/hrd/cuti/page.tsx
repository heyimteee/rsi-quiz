import type { Metadata } from "next";
import Link from "next/link";
import {
  CalendarCheck2,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock3,
  RotateCcw,
  Search,
  Users,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { SubmitButton } from "@/components/ui/submit-button";
import { Alert } from "@/components/ui/alert";
import { getLeaveOverview } from "@/lib/services/leave-service";
import { leavePeriodRange } from "@/lib/domain/leave";
import { MONTH_NAMES } from "@/lib/constants";
import { firstParam, formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Daftar Pengajuan Cuti" };

type SearchParams = Promise<{
  tanggal?: string | string[];
  bulan?: string | string[];
  tahun?: string | string[];
}>;

function parseInteger(value: string | undefined, fallback: number) {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export default async function LeaveListPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const now = new Date();
  const month = Math.min(12, Math.max(1, parseInteger(firstParam(params.bulan), now.getMonth() + 1)));
  const year = Math.min(
    now.getFullYear() + 2,
    Math.max(2000, parseInteger(firstParam(params.tahun), now.getFullYear())),
  );
  const dayParam = firstParam(params.tanggal)?.trim();
  const parsedDay = dayParam ? Number.parseInt(dayParam, 10) : undefined;
  const day = Number.isFinite(parsedDay) ? parsedDay : undefined;

  const period = { day, month, year };
  const validRange = leavePeriodRange(period);
  const effectivePeriod = validRange ? period : { month, year };
  const overview = await getLeaveOverview(effectivePeriod);

  const periodLabel = validRange && day
    ? `${day} ${MONTH_NAMES[month - 1]} ${year}`
    : `${MONTH_NAMES[month - 1]} ${year}`;

  const yearOptions = Array.from({ length: 5 }, (_, index) => now.getFullYear() - 2 + index);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Studi Kasus 01 · Manajer HRD"
        title="Daftar Pengajuan Cuti"
        description="Pilih periode untuk melihat pegawai yang mengajukan cuti. Pengajuan yang rentang tanggalnya beririsan dengan periode tetap ditampilkan."
        actions={
          <Link href="/hrd/pegawai" className="btn-secondary">
            <Users className="size-4" aria-hidden />
            Riwayat & Hak Cuti Pegawai
          </Link>
        }
      />

      <section className="card p-4 sm:p-5" aria-label="Filter periode cuti">
        <form method="get" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto]">
          <div>
            <label htmlFor="bulan" className="label">
              Bulan
            </label>
            <select id="bulan" name="bulan" defaultValue={String(month)} className="input">
              {MONTH_NAMES.map((name, index) => (
                <option key={name} value={index + 1}>
                  {name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="tahun" className="label">
              Tahun
            </label>
            <select id="tahun" name="tahun" defaultValue={String(year)} className="input">
              {yearOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="tanggal" className="label">
              Tanggal <span className="normal-case tracking-normal">(opsional)</span>
            </label>
            <select id="tanggal" name="tanggal" defaultValue={day ? String(day) : ""} className="input">
              <option value="">Seluruh bulan</option>
              {Array.from({ length: 31 }, (_, index) => index + 1).map((option) => (
                <option key={option} value={option}>
                  Tanggal {option}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end gap-2">
            <SubmitButton className="w-full lg:w-auto">
              <Search className="size-4" aria-hidden />
              Tampilkan
            </SubmitButton>
            <Link href="/hrd/cuti" className="btn-secondary" title="Reset filter">
              <RotateCcw className="size-4" aria-hidden />
              <span className="sr-only">Reset</span>
            </Link>
          </div>
        </form>
        <p className="helper">
          Menampilkan pengajuan pada <span className="font-semibold text-ink">{periodLabel}</span>.
          Pilih tanggal tertentu atau biarkan “Seluruh bulan”.
        </p>
      </section>

      {!validRange ? (
        <Alert variant="warning" title="Tanggal tidak valid">
          Tanggal {day} tidak tersedia pada {MONTH_NAMES[month - 1]} {year}. Filter
          ditampilkan untuk seluruh bulan.
        </Alert>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Ringkasan cuti">
        <StatCard label="Pegawai mengajukan" value={overview.employeeCount} icon={Users} tone="sky" />
        <StatCard label="Total pengajuan" value={overview.summary.total} icon={ClipboardList} />
        <StatCard
          label="Disetujui"
          value={overview.summary.approved}
          icon={CheckCircle2}
          tone="green"
        />
        <StatCard
          label="Menunggu"
          value={overview.summary.pending}
          icon={Clock3}
          tone="amber"
        />
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="section-title">Pengajuan pada periode ini</h2>
            <p className="text-sm text-muted">
              {overview.rows.length} pengajuan dari {overview.employeeCount} pegawai.
            </p>
          </div>
          <p className="text-xs text-muted">
            {formatDate(validRange?.start ?? new Date(year, month - 1, 1))} –{" "}
            {formatDate(validRange?.end ?? new Date(year, month, 0))}
          </p>
        </div>

        {overview.rows.length === 0 ? (
          <EmptyState
            icon={CalendarCheck2}
            title="Tidak ada pengajuan cuti"
            description={`Belum ada pegawai yang mengajukan cuti pada ${periodLabel.toLowerCase()}. Coba pilih periode lain.`}
            action={
              <Link href="/hrd/cuti" className="btn-secondary">
                <RotateCcw className="size-4" aria-hidden />
                Kembali ke bulan ini
              </Link>
            }
          />
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <caption className="sr-only">
                Daftar pegawai yang mengajukan cuti pada {periodLabel}
              </caption>
              <thead>
                <tr>
                  <th scope="col">Pegawai</th>
                  <th scope="col">Departemen</th>
                  <th scope="col">Periode cuti</th>
                  <th scope="col">Durasi</th>
                  <th scope="col">Status</th>
                  <th scope="col" className="text-right">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody>
                {overview.rows.map((row) => (
                  <tr key={row.id} data-testid="leave-row">
                    <td>
                      <p className="font-semibold text-ink">{row.employee.name}</p>
                      <p className="text-xs text-muted">NIP {row.employee.nip}</p>
                    </td>
                    <td className="text-muted">{row.employee.department}</td>
                    <td className="whitespace-nowrap">
                      {formatDate(row.startDate)} – {formatDate(row.endDate)}
                    </td>
                    <td>
                      <span className="font-semibold">{row.duration}</span>{" "}
                      <span className="text-xs text-muted">hari</span>
                    </td>
                    <td>
                      <StatusBadge status={row.status} kind="leave" />
                    </td>
                    <td className="text-right">
                      <Link
                        href={`/hrd/cuti/${row.id}`}
                        className="btn-secondary btn-sm"
                        aria-label={`Lihat detail cuti ${row.employee.name}`}
                      >
                        Detail
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="flex items-center gap-2 rounded-xl border border-dashed border-line bg-surface/70 px-4 py-3 text-xs text-muted">
        <CalendarDays className="size-4 shrink-0 text-sky" aria-hidden />
        Durasi cuti dihitung sebagai jumlah hari kalender, termasuk tanggal mulai dan tanggal
        selesai.
      </div>
    </div>
  );
}
