import type { Metadata } from "next";
import Link from "next/link";
import { ClipboardList, Plane, Search, Ticket, Users } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { SubmitButton } from "@/components/ui/submit-button";
import { requireRole } from "@/lib/auth/session";
import { getAllBookings } from "@/lib/services/travel-service";
import { filterBookingsByStatus } from "@/lib/domain/booking";
import {
  ALL_BOOKING_STATUSES,
  BOOKING_STATUS_LABELS,
} from "@/lib/constants";
import { firstParam, formatDate, formatIDR, formatTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Status Pemesanan Tiket" };

type SearchParams = Promise<{ status?: string | string[]; q?: string | string[] }>;

const tabs = [
  { value: "all", label: "Semua" },
  ...ALL_BOOKING_STATUSES.map((status) => ({
    value: status,
    label: BOOKING_STATUS_LABELS[status] ?? status,
  })),
];

export default async function TravelBookingListPage({ searchParams }: { searchParams: SearchParams }) {
  await requireRole("TRAVEL_MANAGER");
  const params = await searchParams;
  const requestedStatus = firstParam(params.status) ?? "all";
  const status = tabs.some((tab) => tab.value === requestedStatus) ? requestedStatus : "all";
  const query = (firstParam(params.q) ?? "").trim();

  const allBookings = await getAllBookings();
  const withQuery = query
    ? allBookings.filter((booking) => {
        const haystack = `${booking.referenceCode} ${booking.passenger.name} ${booking.passenger.email}`.toLowerCase();
        return haystack.includes(query.toLowerCase());
      })
    : allBookings;
  const filtered = filterBookingsByStatus(withQuery, status);

  const counts = allBookings.reduce(
    (summary, booking) => {
      summary.total += 1;
      if (booking.status === "CONFIRMED") summary.confirmed += 1;
      else if (booking.status === "BOOKED") summary.booked += 1;
      else if (booking.status === "WAITING_FOR_PAYMENT") summary.waiting += 1;
      else if (booking.status === "CANCELLED") summary.cancelled += 1;
      return summary;
    },
    { total: 0, confirmed: 0, booked: 0, waiting: 0, cancelled: 0 },
  );

  const countFor = (value: string) => {
    if (value === "all") return counts.total;
    if (value === "CONFIRMED") return counts.confirmed;
    if (value === "BOOKED") return counts.booked;
    if (value === "WAITING_FOR_PAYMENT") return counts.waiting;
    if (value === "CANCELLED") return counts.cancelled;
    return 0;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Studi Kasus 07 · Manajer Travel"
        title="Status Pemesanan Tiket"
        description="Pantau seluruh pemesanan beserta statusnya. Gunakan filter untuk menemukan pemesanan berstatus Confirmed, Booked, atau Waiting for Payment."
        actions={
          <Link href="/travel/cari" className="btn-primary">
            <Plane className="size-4" aria-hidden />
            Pesan untuk pengunjung
          </Link>
        }
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5" aria-label="Ringkasan status pemesanan">
        <StatCard label="Total pemesanan" value={counts.total} icon={ClipboardList} tone="sky" />
        <StatCard label="Confirmed" value={counts.confirmed} icon={Ticket} tone="green" />
        <StatCard label="Booked" value={counts.booked} icon={Plane} tone="sky" />
        <StatCard label="Waiting for Payment" value={counts.waiting} icon={Users} tone="amber" />
        <StatCard label="Cancelled" value={counts.cancelled} icon={Ticket} tone="red" />
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Filter status pemesanan">
          {tabs.map((tab) => (
            <Link
              key={tab.value}
              href={`/travel/pemesanan?status=${tab.value}${query ? `&q=${encodeURIComponent(query)}` : ""}`}
              role="tab"
              aria-selected={status === tab.value}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition ${
                status === tab.value ? "bg-navy text-white" : "bg-white text-muted hover:bg-sky-soft"
              }`}
            >
              {tab.label}
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                  status === tab.value ? "bg-white/20 text-white" : "bg-canvas text-muted"
                }`}
              >
                {countFor(tab.value)}
              </span>
            </Link>
          ))}
        </div>

        <form method="get" className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <input type="hidden" name="status" value={status} />
          <div className="flex-1">
            <label htmlFor="q" className="label">
              Cari kode booking atau pengunjung
            </label>
            <input
              id="q"
              name="q"
              type="search"
              defaultValue={query}
              placeholder="TRV-XXXXXX, nama, atau email"
              className="input"
            />
          </div>
          <SubmitButton variant="secondary">
            <Search className="size-4" aria-hidden />
            Cari
          </SubmitButton>
          {query ? (
            <Link href={`/travel/pemesanan?status=${status}`} className="btn-ghost">
              Reset
            </Link>
          ) : null}
        </form>
      </section>

      {filtered.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="Tidak ada pemesanan"
          description={
            query
              ? `Tidak ada pemesanan yang cocok dengan pencarian “${query}” pada filter ini.`
              : "Belum ada pemesanan dengan status yang dipilih."
          }
          action={
            <Link href="/travel/pemesanan" className="btn-secondary">
              Tampilkan semua pemesanan
            </Link>
          }
        />
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <caption className="sr-only">Daftar pemesanan tiket dan statusnya</caption>
            <thead>
              <tr>
                <th scope="col">Kode booking</th>
                <th scope="col">Penumpang</th>
                <th scope="col">Rute</th>
                <th scope="col">Keberangkatan</th>
                <th scope="col">Status</th>
                <th scope="col">Total</th>
                <th scope="col" className="text-right">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((booking) => {
                const outbound =
                  booking.segments.find((segment) => segment.leg === "OUTBOUND") ??
                  booking.segments[0];
                const flight = outbound?.flight;
                return (
                  <tr key={booking.id} data-testid="travel-booking-row">
                    <td>
                      <Link
                        href={`/travel/pemesanan/${booking.id}`}
                        className="font-mono text-xs font-bold text-navy hover:underline"
                      >
                        {booking.referenceCode}
                      </Link>
                      <p className="mt-0.5 text-[10px] text-muted">
                        {booking.tripType === "ROUND_TRIP" ? "Pulang-pergi" : "Sekali jalan"}
                      </p>
                    </td>
                    <td>
                      <p className="font-semibold">{booking.passenger.name}</p>
                      <p className="text-xs text-muted">{booking.passenger.email}</p>
                    </td>
                    <td className="whitespace-nowrap">
                      {flight ? `${flight.origin.code} → ${flight.destination.code}` : "—"}
                    </td>
                    <td className="whitespace-nowrap">
                      {flight ? `${formatDate(flight.departureAt)} ${formatTime(flight.departureAt)}` : "—"}
                    </td>
                    <td>
                      <StatusBadge status={booking.status} />
                    </td>
                    <td className="font-semibold">{formatIDR(booking.totalPrice)}</td>
                    <td className="text-right">
                      <Link
                        href={`/travel/pemesanan/${booking.id}`}
                        className="btn-secondary btn-sm"
                      >
                        Detail
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
