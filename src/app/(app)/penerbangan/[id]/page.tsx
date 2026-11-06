import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  BadgeCheck,
  Clock3,
  Info,
  Plane,
  PlaneTakeoff,
  ShieldCheck,
  Users,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Alert } from "@/components/ui/alert";
import { BookingForm } from "@/components/booking-form";
import { requireRole } from "@/lib/auth/session";
import { getFlightById, isDepartureInFuture } from "@/lib/services/flight-service";
import { getPassengerProfile } from "@/lib/services/booking-service";
import {
  durationMinutes,
  formatDate,
  formatDuration,
  formatIDR,
  formatLongDate,
  formatTime,
  toDateInputValue,
} from "@/lib/utils";

export const metadata: Metadata = { title: "Detail & Pemesanan Tiket" };

export default async function FlightDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireRole(["PASSENGER", "MEMBER"]);
  const flight = await getFlightById(id);
  if (!flight) notFound();

  const profile = await getPassengerProfile(user.id);
  const departurePassed = !isDepartureInFuture(flight.departureAt);
  const unavailable = departurePassed || flight.seatsAvailable <= 0;
  const duration = formatDuration(durationMinutes(flight.departureAt, flight.arrivalAt));

  return (
    <div className="space-y-6">
      <Link
        href="/penerbangan"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-ink"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Kembali ke hasil pencarian
      </Link>

      <PageHeader
        eyebrow="Studi Kasus 02 · Detail Penerbangan"
        title={`${flight.origin.city} ke ${flight.destination.city}`}
        description={`${flight.airline.name} ${flight.flightNumber} · ${formatLongDate(flight.departureAt)}`}
        actions={<span className="badge bg-sky-soft text-sky">Tersedia</span>}
      />

      <div className="grid gap-4 lg:grid-cols-[1.45fr_1fr]">
        <section className="card p-5 sm:p-6" data-testid="flight-detail">
          <div className="flex items-center justify-between gap-3 border-b border-line pb-4">
            <div className="flex items-center gap-3">
              <span className="flex size-11 items-center justify-center rounded-xl bg-navy text-xs font-bold text-white">
                {flight.airline.code}
              </span>
              <div>
                <p className="font-bold">{flight.airline.name}</p>
                <p className="text-xs text-muted">
                  {flight.flightNumber} · {formatDate(flight.departureAt)}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xl font-extrabold text-navy">{formatIDR(flight.price)}</p>
              <p className="text-[10px] text-muted">per penumpang</p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
            <div>
              <p className="text-3xl font-extrabold tracking-tight">{formatTime(flight.departureAt)}</p>
              <p className="mt-1 text-sm font-bold text-muted">{flight.origin.code}</p>
              <p className="text-xs text-muted">{flight.origin.name}</p>
              <p className="mt-1 text-xs text-muted">{flight.origin.city}</p>
            </div>
            <div className="flex min-w-28 flex-col items-center gap-1 text-muted">
              <span className="flex items-center gap-1 text-[11px]">
                <Clock3 className="size-3.5" aria-hidden />
                {duration}
              </span>
              <span className="flex w-full items-center gap-1">
                <span className="size-2 rounded-full border-2 border-sky" />
                <span className="h-px flex-1 bg-line" />
                <PlaneTakeoff className="size-4 rotate-45 text-sky" aria-hidden />
                <span className="h-px flex-1 bg-line" />
                <span className="size-2 rounded-full bg-sky" />
              </span>
              <span className="text-[10px]">penerbangan langsung</span>
            </div>
            <div className="text-right">
              <p className="text-3xl font-extrabold tracking-tight">{formatTime(flight.arrivalAt)}</p>
              <p className="mt-1 text-sm font-bold text-muted">{flight.destination.code}</p>
              <p className="text-xs text-muted">{flight.destination.name}</p>
              <p className="mt-1 text-xs text-muted">{flight.destination.city}</p>
            </div>
          </div>

          <div className="mt-6 grid gap-3 border-t border-line pt-4 sm:grid-cols-3">
            <div className="rounded-xl bg-canvas p-3">
              <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted">
                <Users className="size-3.5" aria-hidden />
                Kursi tersedia
              </p>
              <p className="mt-1 font-bold">{flight.seatsAvailable} kursi</p>
            </div>
            <div className="rounded-xl bg-canvas p-3">
              <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted">
                <Plane className="size-3.5" aria-hidden />
                Maskapai
              </p>
              <p className="mt-1 font-bold">{flight.airline.name}</p>
            </div>
            <div className="rounded-xl bg-canvas p-3">
              <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted">
                <BadgeCheck className="size-3.5" aria-hidden />
                Kelas
              </p>
              <p className="mt-1 font-bold">Ekonomi</p>
            </div>
          </div>

          <div className="mt-4 flex items-start gap-2 rounded-xl bg-sky-soft/60 p-3 text-xs leading-relaxed text-navy">
            <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
            Tiket elektronik akan dikirim ke email akun Anda setelah pemesanan berhasil. Tunjukkan
            e-tiket dan identitas saat check-in.
          </div>
        </section>

        <section className="card p-5 sm:p-6">
          {unavailable ? (
            <div className="space-y-4">
              <Alert variant="warning" title="Penerbangan tidak dapat dipesan">
                {departurePassed
                  ? "Jadwal keberangkatan penerbangan ini sudah lewat."
                  : "Kursi untuk penerbangan ini sudah habis."}
              </Alert>
              <Link href="/penerbangan" className="btn-secondary w-full">
                Cari penerbangan lain
              </Link>
            </div>
          ) : (
            <BookingForm
              mode="one-way"
              flightId={flight.id}
              price={flight.price}
              defaults={{
                fullName: profile?.fullName ?? user.name,
                nik: profile?.nik ?? "",
                phone: profile?.phone ?? "",
                birthDate: toDateInputValue(profile?.birthDate),
              }}
              title="Data penumpang"
              submitLabel="Pesan tiket sekarang"
            />
          )}
        </section>
      </div>

      <p className="flex items-center gap-1.5 text-xs text-muted">
        <ShieldCheck className="size-4 text-emerald-600" aria-hidden />
        Pembayaran disimulasikan untuk kebutuhan demo. Tiket langsung diterbitkan setelah konfirmasi.
      </p>
    </div>
  );
}
