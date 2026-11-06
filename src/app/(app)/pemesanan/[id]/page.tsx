import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Mail,
  PlaneTakeoff,
  Ticket,
  UserRound,
  XCircle,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Alert } from "@/components/ui/alert";
import { StatusBadge } from "@/components/ui/status-badge";
import { CancelBookingForm } from "@/components/cancel-booking-form";
import { requireRole } from "@/lib/auth/session";
import { getBookingForUser } from "@/lib/services/booking-service";
import { canCancelBooking } from "@/lib/domain/booking";
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

export const metadata: Metadata = { title: "Detail Pemesanan" };

type SearchParams = Promise<{
  baru?: string;
  dibatalkan?: string;
  gagal?: string;
  pp?: string;
}>;

const validationLabels: Record<string, string> = {
  PENDING: "Belum divalidasi",
  VALID: "Tervalidasi",
  REJECTED: "Ditolak",
};

export default async function BookingDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: SearchParams;
}) {
  const { id } = await params;
  const query = await searchParams;
  const user = await requireRole(["PASSENGER", "MEMBER", "VISITOR"]);
  const booking = await getBookingForUser(id, user.id);
  if (!booking) notFound();

  const earliest = booking.segments.reduce(
    (date, segment) =>
      new Date(segment.flight.departureAt) < date
        ? new Date(segment.flight.departureAt)
        : date,
    new Date(booking.segments[0]?.flight.departureAt ?? 0),
  );
  const cancellable = canCancelBooking({ status: booking.status, departureAt: earliest });
  const profile = booking.passenger.profile;

  return (
    <div className="space-y-6">
      <Link
        href={user.role === "VISITOR" ? "/tiket-saya" : "/pemesanan"}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-ink"
      >
        <ArrowLeft className="size-4" aria-hidden />
        {user.role === "VISITOR" ? "Kembali ke tiket saya" : "Kembali ke pemesanan saya"}
      </Link>

      {firstParam(query.baru) ? (
        <Alert variant="success" title="Pemesanan berhasil">
          E-tiket sudah diterbitkan dan dikirim ke email <strong>{booking.passenger.email}</strong>.
          Simpan kode booking <strong>{booking.referenceCode}</strong> untuk check-in.
        </Alert>
      ) : null}
      {firstParam(query.dibatalkan) ? (
        <Alert variant="success" title="Pemesanan berhasil dibatalkan">
          Status pemesanan telah berubah menjadi Cancelled dan kursi dikembalikan ke ketersediaan.
        </Alert>
      ) : null}
      {firstParam(query.gagal) ? (
        <Alert variant="error" title="Pembatalan gagal">
          {firstParam(query.gagal)}
        </Alert>
      ) : null}

      <PageHeader
        eyebrow="E-Tiket · TravelKu"
        title={`Pemesanan ${booking.referenceCode}`}
        description={`Dibuat ${formatDateTime(booking.createdAt)} · ${booking.tripType === "ROUND_TRIP" ? "Pulang-pergi" : "Sekali jalan"}`}
        actions={<StatusBadge status={booking.status} className="text-xs" />}
      />

      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-4">
          <section className="card p-5" aria-labelledby="penumpang">
            <div className="flex items-center gap-2">
              <UserRound className="size-5 text-sky" aria-hidden />
              <h2 id="penumpang" className="section-title">
                Data penumpang
              </h2>
            </div>
            <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-muted">Nama</dt>
                <dd className="mt-1 font-semibold">{profile?.fullName ?? booking.passenger.name}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-muted">NIK</dt>
                <dd className="mt-1 font-mono text-xs">{maskNik(profile?.nik)}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-muted">Telepon</dt>
                <dd className="mt-1">{profile?.phone ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-muted">Email</dt>
                <dd className="mt-1 flex items-center gap-1.5 break-all">
                  <Mail className="size-3.5 shrink-0 text-muted" aria-hidden />
                  {booking.passenger.email}
                </dd>
              </div>
            </dl>
          </section>

          <section className="space-y-3" aria-labelledby="itinerary">
            <div className="flex items-center gap-2">
              <PlaneTakeoff className="size-5 text-sky" aria-hidden />
              <h2 id="itinerary" className="section-title">
                Itinerary penerbangan
              </h2>
            </div>
            {booking.segments.map((segment, index) => {
              const flight = segment.flight;
              return (
                <article key={segment.id} className="card p-4" data-testid="booking-segment">
                  <div className="flex items-center justify-between gap-2">
                    <span className="badge bg-sky-soft text-sky">
                      {segment.leg === "RETURN"
                        ? "Kepulangan"
                        : booking.tripType === "ROUND_TRIP"
                          ? "Keberangkatan"
                          : `Penerbangan ${index + 1}`}
                    </span>
                    <span className="text-xs text-muted">{flight.airline.name} · {flight.flightNumber}</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-lg font-extrabold">{formatTime(flight.departureAt)}</p>
                      <p className="text-xs font-semibold text-muted">{flight.origin.code} · {flight.origin.city}</p>
                    </div>
                    <div className="flex flex-col items-center text-[10px] text-muted">
                      <Clock3 className="size-3.5" aria-hidden />
                      {formatDuration(durationMinutes(flight.departureAt, flight.arrivalAt))}
                      <span>langsung</span>
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
          <section className="card border-sky/30 p-5" aria-labelledby="kode-booking">
            <div className="flex items-center gap-2">
              <Ticket className="size-5 text-sky" aria-hidden />
              <h2 id="kode-booking" className="section-title">
                Kode booking
              </h2>
            </div>
            <p
              data-testid="booking-reference"
              className="mt-3 rounded-xl bg-navy px-4 py-3 text-center text-xl font-extrabold tracking-[0.18em] text-white"
            >
              {booking.referenceCode}
            </p>
            <p className="mt-2 text-center text-[11px] text-muted">
              Gunakan kode ini untuk verifikasi di konter atau aplikasi.
            </p>
            <div className="mt-4 space-y-2 border-t border-line pt-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-muted">
                  <BadgeCheck className="size-4" aria-hidden />
                  Nomor tiket
                </span>
                <span className="font-mono text-xs font-semibold">{booking.ticket?.ticketNumber ?? "—"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted">Status validasi</span>
                <span
                  className={`badge ${
                    booking.ticket?.validationStatus === "VALID"
                      ? "bg-green-soft text-emerald-800"
                      : booking.ticket?.validationStatus === "REJECTED"
                        ? "bg-red-soft text-red-700"
                        : "bg-canvas text-muted"
                  }`}
                >
                  {validationLabels[booking.ticket?.validationStatus ?? "PENDING"]}
                </span>
              </div>
            </div>
          </section>

          <section className="card p-5" aria-labelledby="pembayaran">
            <h2 id="pembayaran" className="section-title">
              Ringkasan pembayaran
            </h2>
            <div className="mt-3 space-y-2 text-sm">
              {booking.segments.map((segment) => (
                <div key={segment.id} className="flex items-center justify-between gap-2">
                  <span className="text-muted">
                    {segment.flight.origin.code} → {segment.flight.destination.code}
                  </span>
                  <span>{formatIDR(segment.flight.price)}</span>
                </div>
              ))}
              <div className="flex items-center justify-between border-t border-line pt-2 text-base font-extrabold">
                <span>Total</span>
                <span className="text-navy">{formatIDR(booking.totalPrice)}</span>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-[11px] text-muted">
              <CheckCircle2 className="size-3.5 text-emerald-600" aria-hidden />
              Pembayaran disimulasikan · tiket langsung terbit
            </div>
          </section>

          {cancellable ? (
            <section className="card p-5" aria-labelledby="pembatalan">
              <h2 id="pembatalan" className="section-title">
                Batalkan pemesanan
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-muted">
                Pembatalan hanya dapat dilakukan sebelum jadwal keberangkatan. Kursi akan
                dikembalikan ke ketersediaan.
              </p>
              <CancelBookingForm
                bookingId={booking.id}
                redirectTo="detail"
                label="Batalkan pemesanan"
                className="btn-danger mt-3 w-full"
              />
            </section>
          ) : (
            <div className="flex items-start gap-2 rounded-xl border border-line bg-surface/70 p-3.5 text-xs text-muted">
              {booking.status === "CANCELLED" ? (
                <XCircle className="mt-0.5 size-4 shrink-0 text-red-500" aria-hidden />
              ) : (
                <Clock3 className="mt-0.5 size-4 shrink-0" aria-hidden />
              )}
              {booking.status === "CANCELLED"
                ? "Pemesanan ini sudah dibatalkan."
                : "Pemesanan tidak dapat dibatalkan karena jadwal keberangkatan sudah lewat."}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
