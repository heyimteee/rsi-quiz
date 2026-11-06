import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck, CalendarDays, Search, Users } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { EmptyState } from "@/components/ui/empty-state";
import { SubmitButton } from "@/components/ui/submit-button";
import { getEmployeeSummaries } from "@/lib/services/leave-service";
import { firstParam, formatDate, initials } from "@/lib/utils";

export const metadata: Metadata = { title: "Riwayat & Hak Cuti Pegawai" };

type SearchParams = Promise<{ q?: string | string[] }>;

export default async function EmployeeListPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const query = (firstParam(params.q) ?? "").trim();
  const summaries = await getEmployeeSummaries();
  const filtered = query
    ? summaries.filter((item) => {
        const haystack = `${item.employee.name} ${item.employee.nip} ${item.employee.department}`.toLowerCase();
        return haystack.includes(query.toLowerCase());
      })
    : summaries;

  const totalRemaining = summaries.reduce((sum, item) => sum + item.remaining, 0);
  const totalRequests = summaries.reduce((sum, item) => sum + item.totalRequests, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Studi Kasus 01 · Manajer HRD"
        title="Riwayat & Hak Cuti Pegawai"
        description="Pilih pegawai untuk melihat seluruh riwayat cuti dan sisa hak cutinya pada tahun berjalan."
        actions={
          <Link href="/hrd/cuti" className="btn-secondary">
            <CalendarDays className="size-4" aria-hidden />
            Daftar Pengajuan
          </Link>
        }
      />

      <section className="grid gap-3 sm:grid-cols-3" aria-label="Ringkasan pegawai">
        <StatCard label="Total pegawai" value={summaries.length} icon={Users} tone="sky" />
        <StatCard label="Total pengajuan" value={totalRequests} icon={CalendarDays} />
        <StatCard
          label="Sisa cuti tahun ini"
          value={`${totalRemaining} hari`}
          icon={BadgeCheck}
          tone="green"
        />
      </section>

      <section className="card p-4 sm:p-5">
        <form method="get" className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label htmlFor="q" className="label">
              Cari pegawai
            </label>
            <input
              id="q"
              name="q"
              type="search"
              defaultValue={query}
              placeholder="Nama, NIP, atau departemen"
              className="input"
            />
          </div>
          <SubmitButton variant="secondary">
            <Search className="size-4" aria-hidden />
            Cari
          </SubmitButton>
          {query ? (
            <Link href="/hrd/pegawai" className="btn-ghost">
              Reset
            </Link>
          ) : null}
        </form>
      </section>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Search}
          title="Pegawai tidak ditemukan"
          description={`Tidak ada pegawai yang cocok dengan pencarian “${query}”.`}
          action={
            <Link href="/hrd/pegawai" className="btn-secondary">
              Tampilkan semua pegawai
            </Link>
          }
        />
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <caption className="sr-only">Daftar pegawai beserta sisa hak cuti tahun berjalan</caption>
            <thead>
              <tr>
                <th scope="col">Pegawai</th>
                <th scope="col">Departemen</th>
                <th scope="col">Pengajuan</th>
                <th scope="col">Cuti terpakai</th>
                <th scope="col">Sisa cuti</th>
                <th scope="col" className="text-right">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => {
                const percentage = item.quota > 0 ? Math.min(100, Math.round((item.used / item.quota) * 100)) : 0;
                return (
                  <tr key={item.employee.id} data-testid="employee-row">
                    <td>
                      <div className="flex items-center gap-3">
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-sky-soft text-[11px] font-bold text-sky">
                          {initials(item.employee.name)}
                        </span>
                        <div>
                          <p className="font-semibold">{item.employee.name}</p>
                          <p className="text-xs text-muted">NIP {item.employee.nip}</p>
                        </div>
                      </div>
                    </td>
                    <td className="text-muted">{item.employee.department}</td>
                    <td>
                      <p className="font-semibold">{item.totalRequests}</p>
                      <p className="text-xs text-muted">
                        {item.lastLeave ? `Terakhir ${formatDate(item.lastLeave.startDate)}` : "Belum ada"}
                      </p>
                    </td>
                    <td className="min-w-40">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold">{item.used} hari</span>
                        <span className="text-muted">dari {item.quota}</span>
                      </div>
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-canvas">
                        <div
                          className="h-full rounded-full bg-amber-400"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          item.remaining <= 3
                            ? "bg-red-soft text-red-700"
                            : "bg-green-soft text-emerald-800"
                        }`}
                      >
                        {item.remaining} hari
                      </span>
                    </td>
                    <td className="text-right">
                      <Link
                        href={`/hrd/pegawai/${item.employee.id}/cuti`}
                        className="btn-secondary btn-sm"
                        aria-label={`Lihat riwayat cuti ${item.employee.name}`}
                      >
                        Riwayat
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs leading-relaxed text-muted">
        “Cuti terpakai” menghitung hari kalender dari pengajuan berstatus disetujui pada tahun
        berjalan. Pengajuan yang melewati pergantian tahun dipotong sesuai tahun berjalan.
      </p>
    </div>
  );
}
