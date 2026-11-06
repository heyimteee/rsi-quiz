import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock3, Plane, Search, UserRound } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import { SubmitButton } from "@/components/ui/submit-button";
import { VisitorBookingForm } from "@/components/travel/visitor-booking-form";
import { requireRole } from "@/lib/auth/session";
import { getFlightById, isDepartureInFuture } from "@/lib/services/flight-service";
import { getVisitors } from "@/lib/services/travel-service";
import { checkProfileCompleteness } from "@/lib/domain/profile";
import {
  durationMinutes,
  firstParam,
  formatDate,
  formatDuration,
  formatIDR,
  formatLongDate,
  formatTime,
} from "@/lib/utils";

export const metadata: Metadata = { title: "Pilih Pengunjung" };

type SearchParams = Promise<{ q?: string | string[] }>;

export default async function TravelVisitorBookingPage({
  params,
  searchParams,
}: {
  params: Promise<{ flightId: string }>;
  searchParams: SearchParams;
}) {
  await requireRole("TRAVEL_MANAGER");
  const { flightId } = await params;
  const query = await searchParams;
  const search = (firstParam(query.q) ?? "").trim();
  const [flight, visitors] = await Promise.all([getFlightById(flightId), getVisitors(search)]);
  if (!flight) notFound();

  const departurePassed = !isDepartureInFuture(flight.departureAt);
  const unavailable = departurePassed || flight.seatsAvailable <= 0;

  const bookableVisitors = visitors.map((visitor) => {
    const completeness = checkProfileCompleteness(visitor.profile);
    return {
      id: visitor.id,
      name: visitor.name,
      email: visitor.email,
      phone: visitor.profile?.phone ?? null,
      nik: visitor.profile?.nik ?? null,
      complete: completeness.complete,
    };
  });

  return (
    <div className="space-y-6">
      <Link
        href={`/travel/cari?asal=${flight.origin.code}&tujuan=${flight.destination.code}`}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-ink"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Kembali ke pencarian penerbangan
      </Link>

      <PageHeader
        eyebrow="Studi Kasus 08 · Manajer Travel"
        title="Pesan Tiket untuk Pengunjung"
        description={`${flight.airline.name} ${flight.flightNumber} · ${formatLongDate(flight.departureAt)}`}
      />

      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <section className="card p-5 sm:p-6" data-testid="travel-flight-summary">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-navy text-xs font-bold text-white">
                {flight.airline.code}
              </span>
              <div>
                <p className="font-bold">{flight.airline.name}</p>
                <p className="text-xs text-muted">{flight.flightNumber}</p>
              </div>
            </div>
            <p className="text-xl font-extrabold text-navy">{formatIDR(flight.price)}</p>
          </div>

          <div className="mt-6 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
            <div>
              <p className="text-3xl font-extrabold">{formatTime(flight.departureAt)}</p>
              <p className="text-xs font-bold text-muted">{flight.origin.code}</p>
              <p className="text-[10px] text-muted">{flight.origin.city}</p>
            </div>
            <div className="flex flex-col items-center text-[10px] text-muted">
              <Clock3 className="size-3.5" aria-hidden />
              {formatDuration(durationMinutes(flight.departureAt, flight.arrivalAt))}
              <Plane className="size-4 rotate-45 text-sky" aria-hidden />
            </div>
            <div className="text-right">
              <p className="text-3xl font-extrabold">{formatTime(flight.arrivalAt)}</p>
              <p className="text-xs font-bold text-muted">{flight.destination.code}</p>
              <p className="text-[10px] text-muted">{flight.destination.city}</p>
            </div>
          </div>
          <p className="mt-4 border-t border-line pt-3 text-xs text-muted">
            {formatDate(flight.departureAt)} · {flight.seatsAvailable} kursi tersedia
          </p>
        </section>

        <section className="card p-5 sm:p-6">
          {unavailable ? (
            <div className="space-y-3">
              <Alert variant="warning" title="Penerbangan tidak dapat dipesan">
                {departurePassed
                  ? "Jadwal keberangkatan sudah lewat."
                  : "Kursi untuk penerbangan ini sudah habis."}
              </Alert>
              <Link href="/travel/cari" className="btn-secondary w-full">
                Cari penerbangan lain
              </Link>
            </div>
          ) : (
            <>
              <form method="get" className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end">
                <div className="flex-1">
                  <label htmlFor="q" className="label">
                    Cari pengunjung
                  </label>
                  <input
                    id="q"
                    name="q"
                    type="search"
                    defaultValue={search}
                    placeholder="Nama, email, atau NIK"
                    className="input"
                  />
                </div>
                <SubmitButton variant="secondary">
                  <Search className="size-4" aria-hidden />
                  Cari
                </SubmitButton>
              </form>

              {bookableVisitors.length === 0 ? (
                <EmptyState
                  icon={UserRound}
                  title="Pengunjung tidak ditemukan"
                  description={
                    search
                      ? `Tidak ada pengunjung yang cocok dengan “${search}”.`
                      : "Belum ada akun pengunjung yang terdaftar."
                  }
                />
              ) : (
                <VisitorBookingForm
                  flightId={flight.id}
                  price={flight.price}
                  visitors={bookableVisitors}
                />
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
