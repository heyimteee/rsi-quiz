import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  BadgeCheck,
  BriefcaseBusiness,
  CalendarRange,
  Clock3,
  Mail,
  UserRound,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { Alert } from "@/components/ui/alert";
import { getLeaveDetail } from "@/lib/services/leave-service";
import { LEAVE_STATUS_LABELS, MONTH_NAMES } from "@/lib/constants";
import { formatDate, formatDateTime, initials } from "@/lib/utils";

export const metadata: Metadata = { title: "Detail Pengajuan Cuti" };

export default async function LeaveDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const leave = await getLeaveDetail(id);
  if (!leave) notFound();

  const start = new Date(leave.startDate);
  const currentYear = new Date().getFullYear();

  return (
    <div className="space-y-6">
      <Link href="/hrd/cuti" className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-ink">
        <ArrowLeft className="size-4" aria-hidden />
        Kembali ke daftar pengajuan
      </Link>

      <PageHeader
        eyebrow="Studi Kasus 01 · Detail Pengajuan"
        title="Detail Pengajuan Cuti"
        description={`Pengajuan cuti ${leave.employee.name} pada ${MONTH_NAMES[start.getMonth()]} ${start.getFullYear()}.`}
        actions={<StatusBadge status={leave.status} kind="leave" className="text-xs" />}
      />

      {leave.yearBreakdown.length > 1 ? (
        <Alert variant="info" title="Cuti mencakup dua tahun kalender">
          Durasi total {leave.duration} hari, dengan pembagian:{" "}
          {leave.yearBreakdown
            .map((item) => `${item.days} hari pada ${item.year}`)
            .join(", ")}
          . Sisa hak cuti dihitung per tahun.
        </Alert>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <section className="card p-5 sm:p-6" aria-labelledby="detail-cuti">
          <div className="flex items-center gap-2">
            <CalendarRange className="size-5 text-sky" aria-hidden />
            <h2 id="detail-cuti" className="section-title">
              Informasi cuti
            </h2>
          </div>

          <dl className="mt-5 grid gap-x-6 gap-y-5 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-muted">Tanggal mulai</dt>
              <dd className="mt-1 font-semibold">{formatDate(leave.startDate)}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-muted">Tanggal selesai</dt>
              <dd className="mt-1 font-semibold">{formatDate(leave.endDate)}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-muted">Durasi cuti</dt>
              <dd className="mt-1 text-2xl font-extrabold text-navy">
                {leave.duration} <span className="text-sm font-medium text-muted">hari</span>
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-muted">Status pengajuan</dt>
              <dd className="mt-1">
                <StatusBadge status={leave.status} kind="leave" />
                <p className="mt-1 text-xs text-muted">
                  {LEAVE_STATUS_LABELS[leave.status] ?? leave.status}
                </p>
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs font-semibold uppercase tracking-wide text-muted">Alasan cuti</dt>
              <dd className="mt-1 leading-relaxed">{leave.reason}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs font-semibold uppercase tracking-wide text-muted">Waktu pengajuan</dt>
              <dd className="mt-1 text-sm text-muted">{formatDateTime(leave.requestedAt)}</dd>
            </div>
          </dl>
        </section>

        <div className="space-y-4">
          <section className="card p-5" aria-labelledby="pegawai">
            <div className="flex items-center gap-2">
              <UserRound className="size-5 text-sky" aria-hidden />
              <h2 id="pegawai" className="section-title">
                Pegawai
              </h2>
            </div>
            <div className="mt-4 flex items-center gap-3">
              <span className="flex size-12 items-center justify-center rounded-2xl bg-sky-soft text-sm font-bold text-sky">
                {initials(leave.employee.name)}
              </span>
              <div>
                <p className="font-bold">{leave.employee.name}</p>
                <p className="text-xs text-muted">NIP {leave.employee.nip}</p>
              </div>
            </div>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <BriefcaseBusiness className="size-4 text-muted" aria-hidden />
                <dt className="sr-only">Departemen</dt>
                <dd>{leave.employee.department}</dd>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="size-4 text-muted" aria-hidden />
                <dt className="sr-only">Email</dt>
                <dd className="truncate">{leave.employee.email}</dd>
              </div>
            </dl>
            <Link
              href={`/hrd/pegawai/${leave.employeeId}/cuti`}
              className="btn-secondary mt-4 w-full"
            >
              Lihat riwayat cuti
            </Link>
          </section>

          <section className="card p-5" aria-labelledby="hak-cuti">
            <div className="flex items-center gap-2">
              <BadgeCheck className="size-5 text-emerald-600" aria-hidden />
              <h2 id="hak-cuti" className="section-title">
                Hak cuti {currentYear}
              </h2>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl bg-canvas p-2.5">
                <p className="text-lg font-extrabold">{leave.quota.quota}</p>
                <p className="text-[10px] uppercase tracking-wide text-muted">Kuota</p>
              </div>
              <div className="rounded-xl bg-amber-soft p-2.5">
                <p className="text-lg font-extrabold">{leave.quota.used}</p>
                <p className="text-[10px] uppercase tracking-wide text-muted">Terpakai</p>
              </div>
              <div className="rounded-xl bg-green-soft p-2.5">
                <p className="text-lg font-extrabold text-emerald-700">{leave.quota.remaining}</p>
                <p className="text-[10px] uppercase tracking-wide text-muted">Sisa</p>
              </div>
            </div>
            <p className="mt-3 flex items-start gap-1.5 text-xs leading-relaxed text-muted">
              <Clock3 className="mt-0.5 size-3.5 shrink-0" aria-hidden />
              Sisa dihitung dari pengajuan berstatus disetujui pada tahun berjalan.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
