import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Clock3, PlaneTakeoff, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Alert } from "@/components/ui/alert";
import { BookingForm } from "@/components/booking-form";
import { requireRole } from "@/lib/auth/session";
import { getFlightsByIds } from "@/lib/services/flight-service";
import { getPassengerProfile } from "@/lib/services/booking-service";
import {
  durationMinutes,
  firstParam,
  formatDate,
  formatDuration,
  formatIDR,
  formatTime,
  toDateInputValue,
} from "@/lib/utils";

export const metadata: Metadata = { title: "Data Penumpang Pulang-Pergi" };

type SearchParams = Promise<{ outbound?: string | string[]; return?: string | string[] }>;

export default async function RoundTripPassengerPage({ searchParams }: { searchParams: SearchParams }) {
  const user = await requireRole(["PASSENGER", "MEMBER"]);
  const params = await searchParams;
  const outboundId = firstParam(params.outbound) ?? "";
  const returnId = firstParam(params.return) ?? "";

  const flights = await getFlightsByIds([outboundId, returnId].filter(Boolean));
  const outbound = flights.find((flight) => flight.id === outboundId) ?? null;
  const inbound = flights.find((flight) => flight.id === returnId) ?? null;
  const profile = await getPassengerProfile(user.id);

  const routeValid =
    outbound &&
    inbound &&
    outbound.originId === inbound.destinationId &&
    outbound.destinationId === inbound.originId &&
    new Date(inbound.departureAt) > new Date(outbound.departureAt);

  const backHref = outbound
    ? `/pulang-pergi?cari=1&asal=${outbound.origin.code}&tujuan=${outbound.destination.code}&berangkat=${toDateInputValue(outbound.departureAt)}&pulang=${toDateInputValue(inbound?.departureAt ?? outbound.departureAt)}`
    : "/pulang-pergi";

  if (!outbound || !inbound || !routeValid) {
    return (
      <div className="space-y-6">
        <Link href={backHref} className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-ink">
          <ArrowLeft className="size-4" aria-hidden />
          Kembali ke pencarian
        </Link>
        <Alert variant="error" title="Rute tidak valid">
          Penerbangan keberangkatan dan kepulangan tidak cocok. Silakan pilih ulang penerbangan
          pulang-pergi.
        </Alert>
        <Link href="/pulang-pergi" className="btn-primary">
          Cari ulang
        </Link>
      </div>
    );
  }

  const total = outbound.price + inbound.price;

  return (
    <div className="space-y-6">
      <Link href={backHref} className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-ink">
        <ArrowLeft className="size-4" aria-hidden />
        Kembali ke pilihan penerbangan
      </Link>

      <PageHeader
        eyebrow="Studi Kasus 10 · Langkah 2 dari 2"
        title="Lengkapi Data Penumpang"
        description="Periksa rincian jadwal, maskapai, dan total harga sebelum menyelesaikan pemesanan pulang-pergi."
      />

      <div className="grid gap-4 lg:grid-cols-[1.45fr_1fr]">
        <div className="space-y-3">
          {[
            { label: "Keberangkatan", flight: outbound },
            { label: "Kepulangan", flight: inbound },
          ].map(({ label, flight }) => (
            <section key={flight.id} className="card p-4 sm:p-5" data-testid="roundtrip-segment">
              <div className="flex items-center justify-between gap-2">
                <span className="badge bg-sky-soft text-sky">{label}</span>
                <span className="text-xs text-muted">
                  {flight.airline.name} · {flight.flightNumber}
                </span>
              </div>
              <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                <div>
                  <p className="text-2xl font-extrabold">{formatTime(flight.departureAt)}</p>
                  <p className="text-xs font-bold text-muted">{flight.origin.code}</p>
                  <p className="text-[10px] text-muted">{flight.origin.city}</p>
                </div>
                <div className="flex flex-col items-center text-[10px] text-muted">
                  <Clock3 className="size-3.5" aria-hidden />
                  {formatDuration(durationMinutes(flight.departureAt, flight.arrivalAt))}
                  <PlaneTakeoff className="size-4 text-sky" aria-hidden />
                </div>
                <div className="text-right">
                  <p className="text-2xl font-extrabold">{formatTime(flight.arrivalAt)}</p>
                  <p className="text-xs font-bold text-muted">{flight.destination.code}</p>
                  <p className="text-[10px] text-muted">{flight.destination.city}</p>
                </div>
              </div>
              <p className="mt-3 text-xs text-muted">{formatDate(flight.departureAt)}</p>
              <div className="mt-3 flex items-center justify-between border-t border-line pt-3 text-sm">
                <span className="text-muted">Harga tiket</span>
                <span className="font-bold">{formatIDR(flight.price)}</span>
              </div>
            </section>
          ))}

          <div className="card flex items-center justify-between p-4">
            <span className="font-semibold">Total pulang-pergi</span>
            <span className="text-xl font-extrabold text-navy">{formatIDR(total)}</span>
          </div>

          <div className="flex items-start gap-2 rounded-xl bg-sky-soft/60 p-3 text-xs leading-relaxed text-navy">
            <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden />
            Rute sudah divalidasi: keberangkatan {outbound.origin.code} → {outbound.destination.code},
            kepulangan {inbound.origin.code} → {inbound.destination.code}.
          </div>
        </div>

        <section className="card p-5 sm:p-6">
          <BookingForm
            mode="round-trip"
            outboundId={outbound.id}
            returnId={inbound.id}
            price={total}
            defaults={{
              fullName: profile?.fullName ?? user.name,
              nik: profile?.nik ?? "",
              phone: profile?.phone ?? "",
              birthDate: toDateInputValue(profile?.birthDate),
            }}
            title="Data penumpang"
            submitLabel="Konfirmasi pemesanan pulang-pergi"
          />
        </section>
      </div>
    </div>
  );
}
