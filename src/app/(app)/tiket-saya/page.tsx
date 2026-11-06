import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, Clock3, Mail, Plane, Ticket } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { requireRole } from "@/lib/auth/session";
import { getBookingsForUser } from "@/lib/services/booking-service";
import { formatDate, formatIDR, formatTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Tiket Saya" };

export default async function VisitorTicketsPage() {
  const user = await requireRole("VISITOR");
  const bookings = await getBookingsForUser(user.id);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Studi Kasus 08 · Pengunjung"
        title="Tiket Saya"
        description="Melihat tiket yang dipesankan atas nama Anda oleh manajer travel. E-tiket juga dikirim ke email terdaftar."
        actions={
          <span className="badge bg-sky-soft text-sky">
            <Mail className="size-3.5" aria-hidden />
            {user.email}
          </span>
        }
      />

      {bookings.length === 0 ? (
        <EmptyState
          icon={Ticket}
          title="Belum ada tiket"
          description="Tiket yang dipesankan manajer travel atas nama Anda akan muncul di halaman ini."
        />
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {bookings.map((booking) => {
            const outbound =
              booking.segments.find((segment) => segment.leg === "OUTBOUND") ??
              booking.segments[0];
            const flight = outbound?.flight;
            return (
              <article key={booking.id} className="card p-5" data-testid="visitor-ticket">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-xs font-bold text-navy">{booking.referenceCode}</p>
                    <h2 className="mt-1 text-lg font-extrabold">
                      {flight?.origin.city} → {flight?.destination.city}
                    </h2>
                    <p className="mt-0.5 text-xs text-muted">
                      {flight?.airline.name} · {flight?.flightNumber}
                    </p>
                  </div>
                  <StatusBadge status={booking.status} />
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 border-y border-line/70 py-3 text-sm">
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-muted">Keberangkatan</p>
                    <p className="mt-0.5 flex items-center gap-1 font-semibold">
                      <CalendarDays className="size-3.5 text-muted" aria-hidden />
                      {flight ? formatDate(flight.departureAt) : "—"}
                    </p>
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-muted">
                      <Clock3 className="size-3.5" aria-hidden />
                      {flight ? formatTime(flight.departureAt) : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-muted">E-tiket</p>
                    <p className="mt-0.5 font-mono text-xs font-semibold">
                      {booking.ticket?.ticketNumber ?? "—"}
                    </p>
                    <p className="mt-0.5 text-xs text-muted">{formatIDR(booking.totalPrice)}</p>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 text-[11px] text-muted">
                    <Plane className="size-3.5" aria-hidden />
                    {booking.segments.length} penerbangan
                  </span>
                  <Link href={`/pemesanan/${booking.id}`} className="btn-primary btn-sm">
                    Lihat e-tiket
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <p className="flex items-center gap-1.5 text-xs text-muted">
        <Mail className="size-4 text-sky" aria-hidden />
        E-tiket dikirim ke email pengunjung yang terdaftar. Hubungi manajer travel jika ada
        ketidaksesuaian data.
      </p>
    </div>
  );
}
