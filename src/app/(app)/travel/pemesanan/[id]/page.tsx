import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  BadgeCheck,
  CalendarDays,
  Clock3,
  Mail,
  PlaneTakeoff,
  Ticket,
  UserRound,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Alert } from "@/components/ui/alert";
import { StatusBadge } from "@/components/ui/status-badge";
import { requireRole } from "@/lib/auth/session";
import { getBookingById } from "@/lib/services/booking-service";
import {
  durationMinutes,
  firstParam,
  formatDate,
  formatDateTime,
  formatDuration,
  formatIDR,
  formatTime,
  maskNik,
} from "@/lib/utils";

export const metadata: Metadata = { title: "Detail Pemesanan Travel" };

type SearchParams = Promise<{ baru?: string }>;

export default async function TravelBookingDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: SearchParams;
}) {
  await requireRole("TRAVEL_MANAGER");
  const { id } = await params;
  const query = await searchParams;
  const booking = await getBookingById(id);
  if (!booking) notFound();

  return (
    <div className="space-y-6">
      <Link
        href="/travel/pemesanan"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-ink"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Kembali ke daftar pemesanan
      </Link>

      {firstParam(query.baru) ? (
        <Alert variant="success" title="Pemesanan pengunjung berhasil">
          E-tiket atas nama <strong>{booking.passenger.name}</strong> telah diterbitkan dan
          dikirim ke <strong>{booking.passenger.email}</strong>. Kode booking:{" "}
          <strong>{booking.referenceCode}</strong>.
        </Alert>
      ) : null}

      <PageHeader
        eyebrow="Studi Kasus 07/08 · Manajer Travel"
        title={`Pemesanan ${booking.referenceCode}`}
        description={`Dibuat ${formatDateTime(booking.createdAt)} oleh ${booking.booker.name}`}
        actions={<StatusBadge status={booking.status} className="text-xs" />}
      />

      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-4">
          <section className="card p-5" aria-labelledby="penumpang-travel">
            <div className="flex items-center gap-2">
              <UserRound className="size-5 text-sky" aria-hidden />
              <h2 id="penumpang-travel" className="section-title">
                Data pengunjung / penumpang
              </h2>
            </div>
            <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-muted">Nama</dt>
                <dd className="mt-1 font-semibold">
                  {booking.passenger.profile?.fullName ?? booking.passenger.name}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-muted">NIK</dt>
                <dd className="mt-1 font-mono text-xs">
                  {maskNik(booking.passenger.profile?.nik)}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-muted">Email</dt>
                <dd className="mt-1 flex items-center gap-1.5 break-all">
                  <Mail className="size-3.5 shrink-0 text-muted" aria-hidden />
                  {booking.passenger.email}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Dipesan oleh
                </dt>
                <dd className="mt-1">{booking.booker.name}</dd>
              </div>
            </dl>
          </section>

          <section className="space-y-3" aria-labelledby="itinerary-travel">
            <div className="flex items-center gap-2">
              <PlaneTakeoff className="size-5 text-sky" aria-hidden />
              <h2 id="itinerary-travel" className="section-title">
                Itinerary
              </h2>
            </div>
            {booking.segments.map((segment) => {
              const flight = segment.flight;
              return (
                <article key={segment.id} className="card p-4" data-testid="travel-booking-segment">
                  <div className="flex items-center justify-between gap-2">
                    <span className="badge bg-sky-soft text-sky">
                      {segment.leg === "RETURN" ? "Kepulangan" : "Keberangkatan"}
                    </span>
                    <span className="text-xs text-muted">
                      {flight.airline.name} · {flight.flightNumber}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-lg font-extrabold">{formatTime(flight.departureAt)}</p>
                      <p className="text-xs font-semibold text-muted">
                        {flight.origin.code} · {flight.origin.city}
                      </p>
                    </div>
                    <div className="flex flex-col items-center text-[10px] text-muted">
                      <Clock3 className="size-3.5" aria-hidden />
                      {formatDuration(durationMinutes(flight.departureAt, flight.arrivalAt))}
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-extrabold">{formatTime(flight.arrivalAt)}</p>
                      <p className="text-xs font-semibold text-muted">
                        {flight.destination.code} · {flight.destination.city}
                      </p>
                    </div>
                  </div>
                  <p className="mt-3 flex items-center gap-1.5 text-xs text-muted">
                    <CalendarDays className="size-3.5" aria-hidden />
                    {formatDate(flight.departureAt)}
                  </p>
                </article>
              );
            })}
          </section>
        </div>

        <aside className="space-y-4">
          <section className="card p-5" aria-labelledby="kode-travel">
            <div className="flex items-center gap-2">
              <Ticket className="size-5 text-sky" aria-hidden />
              <h2 id="kode-travel" className="section-title">
                Kode booking
              </h2>
            </div>
            <p
              data-testid="travel-booking-reference"
              className="mt-3 rounded-xl bg-navy px-4 py-3 text-center text-xl font-extrabold tracking-[0.18em] text-white"
            >
              {booking.referenceCode}
            </p>
            <div className="mt-4 space-y-2 border-t border-line pt-4 text-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-muted">
                  <BadgeCheck className="size-4" aria-hidden />
                  Nomor tiket
                </span>
                <span className="font-mono text-xs font-semibold">
                  {booking.ticket?.ticketNumber ?? "—"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted">Status validasi</span>
                <span className="text-xs font-semibold">
                  {booking.ticket?.validationStatus ?? "—"}
                </span>
              </div>
            </div>
          </section>

          <section className="card p-5" aria-labelledby="total-travel">
            <h2 id="total-travel" className="section-title">
              Total pembayaran
            </h2>
            <p className="mt-2 text-2xl font-extrabold text-navy">{formatIDR(booking.totalPrice)}</p>
            <Link href="/dev/email" className="btn-secondary mt-3 w-full">
              <Mail className="size-4" aria-hidden />
              Lihat email e-tiket
            </Link>
            <p className="mt-2 text-center text-[11px] text-muted">
              Email tujuan: {booking.passenger.email}
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}
