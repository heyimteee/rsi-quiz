import type { Metadata } from "next";
import Link from "next/link";
import {
  BadgeCheck,
  CalendarDays,
  ClipboardList,
  Clock3,
  Plane,
  Ticket,
  XCircle,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Alert } from "@/components/ui/alert";
import { CancelBookingForm } from "@/components/cancel-booking-form";
import { requireRole } from "@/lib/auth/session";
import { getBookingsForUser } from "@/lib/services/booking-service";
import { canCancelBooking } from "@/lib/domain/booking";
import { firstParam, formatDate, formatIDR, formatTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Pemesanan Saya" };

type SearchParams = Promise<{ dibatalkan?: string; gagal?: string }>;

export default async function MyBookingsPage({ searchParams }: { searchParams: SearchParams }) {
  const user = await requireRole(["PASSENGER", "MEMBER", "VISITOR"]);
  const params = await searchParams;
  const bookings = await getBookingsForUser(user.id);

  const counts = bookings.reduce(
    (summary, booking) => {
      summary.total += 1;
      if (booking.status === "CONFIRMED") summary.confirmed += 1;
      else if (booking.status === "WAITING_FOR_PAYMENT") summary.waiting += 1;
      else if (booking.status === "CANCELLED") summary.cancelled += 1;
      return summary;
    },
    { total: 0, confirmed: 0, waiting: 0, cancelled: 0 },
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Pemesanan Tiket"
        title="Pemesanan Saya"
        description="Melihat seluruh tiket yang Anda pesan, statusnya, dan membatalkan pemesanan yang masih memenuhi ketentuan."
        actions={
          <Link href="/penerbangan" className="btn-primary">
            <Plane className="size-4" aria-hidden />
            Cari penerbangan
          </Link>
        }
      />

      {firstParam(params.dibatalkan) ? (
        <Alert variant="success" title="Pemesanan dibatalkan">
          Kursi telah dilepas dan status pemesanan diperbarui menjadi Cancelled.
        </Alert>
      ) : null}
      {firstParam(params.gagal) ? (
        <Alert variant="error" title="Pembatalan gagal">
          {firstParam(params.gagal)}
        </Alert>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Ringkasan pemesanan">
        <StatCard label="Total pemesanan" value={counts.total} icon={ClipboardList} tone="sky" />
        <StatCard label="Confirmed" value={counts.confirmed} icon={BadgeCheck} tone="green" />
        <StatCard label="Menunggu pembayaran" value={counts.waiting} icon={Clock3} tone="amber" />
        <StatCard label="Dibatalkan" value={counts.cancelled} icon={XCircle} tone="red" />
      </section>

      {bookings.length === 0 ? (
        <EmptyState
          icon={Ticket}
          title="Belum ada pemesanan"
          description="Anda belum memiliki tiket. Cari penerbangan sesuai tujuan dan tanggal perjalanan Anda."
          action={
            <Link href="/penerbangan" className="btn-primary">
              Cari penerbangan
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          {bookings.map((booking) => {
            const first = booking.segments[0]?.flight;
            const last = booking.segments[booking.segments.length - 1]?.flight;
            const earliest = booking.segments.reduce(
              (date, segment) =>
                new Date(segment.flight.departureAt) < date
                  ? new Date(segment.flight.departureAt)
                  : date,
              new Date(first?.departureAt ?? 0),
            );
            const cancellable = canCancelBooking({
              status: booking.status,
              departureAt: earliest,
            });

            return (
              <article key={booking.id} className="card p-4 sm:p-5" data-testid="booking-card">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-start gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-sky-soft text-sky">
                      <Ticket className="size-5" aria-hidden />
                    </span>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/pemesanan/${booking.id}`}
                          className="text-sm font-extrabold tracking-wide text-navy hover:underline"
                        >
                          {booking.referenceCode}
                        </Link>
                        <StatusBadge status={booking.status} />
                        {booking.tripType === "ROUND_TRIP" ? (
                          <span className="badge bg-canvas text-muted">Pulang-pergi</span>
                        ) : null}
                      </div>
                      <p className="mt-1 text-sm font-semibold">
                        {first?.origin.city} ({first?.origin.code}) →{" "}
                        {last?.destination.city} ({last?.destination.code})
                      </p>
                      <p className="mt-0.5 text-xs text-muted">
                        {first ? formatDate(first.departureAt) : "—"} ·{" "}
                        {first?.airline.name} · {booking.passenger.name}
                      </p>
                    </div>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-lg font-extrabold text-navy">{formatIDR(booking.totalPrice)}</p>
                    <p className="text-[11px] text-muted">
                      {booking.segments.length} penerbangan
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex flex-col gap-2 border-t border-line/70 pt-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-wrap gap-3 text-xs text-muted">
                    <span className="flex items-center gap-1">
                      <CalendarDays className="size-3.5" aria-hidden />
                      {first ? formatDate(first.departureAt) : "—"}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock3 className="size-3.5" aria-hidden />
                      {first ? formatTime(first.departureAt) : "—"}
                    </span>
                    {booking.ticket ? (
                      <span>Tiket {booking.ticket.ticketNumber}</span>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link href={`/pemesanan/${booking.id}`} className="btn-secondary btn-sm">
                      Lihat detail
                    </Link>
                    {cancellable ? (
                      <CancelBookingForm
                        bookingId={booking.id}
                        redirectTo="list"
                        label="Batalkan"
                        className="btn-danger btn-sm"
                      />
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
