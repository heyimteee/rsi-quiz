import type { Metadata } from "next";
import Link from "next/link";
import { addDays } from "date-fns";
import {
  ArrowRight,
  CalendarDays,
  MapPin,
  Plane,
  Plus,
  Route,
  Search,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import { SubmitButton } from "@/components/ui/submit-button";
import { requireRole } from "@/lib/auth/session";
import { getAirports, searchFlightOffers } from "@/lib/services/flight-service";
import { getItineraries, getItinerary } from "@/lib/services/itinerary-service";
import { getCheapestFlight } from "@/lib/domain/flight";
import {
  durationMinutes,
  firstParam,
  formatDate,
  formatDuration,
  formatIDR,
  formatTime,
  parseDateOnly,
  toDateInputValue,
} from "@/lib/utils";

export const metadata: Metadata = { title: "Pencarian Multi-Destinasi" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

type SegmentCriteria = {
  originCode: string;
  destinationCode: string;
  date: Date;
  label?: string;
};

function Row({
  index,
  airports,
  defaults,
}: {
  index: number;
  airports: Array<{ id: string; code: string; city: string }>;
  defaults: { origin: string; destination: string; date: string };
}) {
  return (
    <fieldset className="rounded-xl border border-line bg-canvas/40 p-3" data-testid="multi-row">
      <legend className="px-1 text-xs font-bold uppercase tracking-wide text-muted">
        Segmen {index + 1}
      </legend>
      <div className="grid gap-2 sm:grid-cols-3">
        <div>
          <label htmlFor={`asal${index + 1}`} className="label">
            Dari
          </label>
          <select id={`asal${index + 1}`} name={`asal${index + 1}`} defaultValue={defaults.origin} className="input">
            <option value="">— Pilih —</option>
            {airports.map((airport) => (
              <option key={airport.id} value={airport.code}>
                {airport.city} ({airport.code})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={`tujuan${index + 1}`} className="label">
            Tujuan
          </label>
          <select
            id={`tujuan${index + 1}`}
            name={`tujuan${index + 1}`}
            defaultValue={defaults.destination}
            className="input"
          >
            <option value="">— Pilih —</option>
            {airports.map((airport) => (
              <option key={airport.id} value={airport.code}>
                {airport.city} ({airport.code})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={`tanggal${index + 1}`} className="label">
            Tanggal
          </label>
          <input
            id={`tanggal${index + 1}`}
            name={`tanggal${index + 1}`}
            type="date"
            defaultValue={defaults.date}
            className="input"
          />
        </div>
      </div>
    </fieldset>
  );
}

export default async function MultiDestinationSearchPage({ searchParams }: { searchParams: SearchParams }) {
  const user = await requireRole("MEMBER");
  const params = await searchParams;
  const [airports, itineraries] = await Promise.all([getAirports(), getItineraries(user.id)]);

  const itineraryId = firstParam(params.itineraryId) ?? "";
  const requested = firstParam(params.cari) === "1";
  const selectedItinerary = itineraryId ? await getItinerary(itineraryId, user.id) : null;

  let segments: SegmentCriteria[] = [];
  let sourceLabel = "";
  let validationError: string | null = null;

  if (itineraryId) {
    if (!selectedItinerary) {
      validationError = "Rencana perjalanan tidak ditemukan.";
    } else {
      sourceLabel = `Rencana: ${selectedItinerary.name}`;
      segments = selectedItinerary.segments.map((segment) => ({
        originCode: segment.origin.code,
        destinationCode: segment.destination.code,
        date: new Date(segment.departureDate),
        label: segment.origin.city + " → " + segment.destination.city,
      }));
    }
  } else if (requested) {
    for (let index = 1; index <= 3; index++) {
      const origin = (firstParam(params[`asal${index}`]) ?? "").trim().toUpperCase();
      const destination = (firstParam(params[`tujuan${index}`]) ?? "").trim().toUpperCase();
      const dateValue = firstParam(params[`tanggal${index}`]) ?? "";
      const filled = [origin, destination, dateValue].filter(Boolean).length;
      if (filled === 0) continue;
      if (filled < 3) {
        validationError = `Segmen ${index}: kota asal, tujuan, dan tanggal harus diisi lengkap.`;
        break;
      }
      if (origin === destination) {
        validationError = `Segmen ${index}: kota asal dan tujuan tidak boleh sama.`;
        break;
      }
      const date = parseDateOnly(dateValue);
      if (!date) {
        validationError = `Segmen ${index}: tanggal tidak valid.`;
        break;
      }
      segments.push({ originCode: origin, destinationCode: destination, date });
    }
    if (segments.length === 0 && !validationError) {
      validationError = "Isi minimal satu segmen perjalanan.";
    }
  }

  const results = await Promise.all(
    segments.map((segment) =>
      searchFlightOffers({
        originCode: segment.originCode,
        destinationCode: segment.destinationCode,
        date: segment.date,
        sort: "price_asc",
      }),
    ),
  );

  const cheapestPerSegment = results.map((flights) => getCheapestFlight(flights));
  const totalCheapest =
    segments.length > 0 && cheapestPerSegment.every((flight) => flight)
      ? cheapestPerSegment.reduce((sum, flight) => sum + (flight?.price ?? 0), 0)
      : null;

  const tomorrow = toDateInputValue(addDays(new Date(), 2));
  const later = toDateInputValue(addDays(new Date(), 5));

  const defaults = [1, 2, 3].map((index) => {
    const origin = firstParam(params[`asal${index}`]) ?? (index === 1 ? "CGK" : index === 2 ? "DPS" : "");
    const destination =
      firstParam(params[`tujuan${index}`]) ?? (index === 1 ? "DPS" : index === 2 ? "SUB" : "");
    const date =
      firstParam(params[`tanggal${index}`]) ?? (index === 1 ? tomorrow : index === 2 ? later : "");
    return { origin, destination, date };
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Studi Kasus 04 · Member Frequent Traveller"
        title="Pencarian Multi-Destinasi"
        description="Cari penerbangan untuk beberapa rute sekaligus. Setiap segmen dapat memiliki tanggal, kota asal, dan tujuan sendiri; harga termurah ditampilkan per segmen."
        actions={
          <Link href="/member/rencana" className="btn-secondary">
            <Route className="size-4" aria-hidden />
            Kelola rencana
          </Link>
        }
      />

      <div className="grid items-start gap-4 lg:grid-cols-2">
        <section className="card p-4 sm:p-5" aria-labelledby="dari-rencana">
          <h2 id="dari-rencana" className="section-title">
            Gunakan rencana perjalanan
          </h2>
          <p className="mt-1 text-xs text-muted">
            Muat rute yang sudah disimpan, lalu cari penerbangan untuk seluruh segmen.
          </p>
          <form method="get" className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end">
            <input type="hidden" name="cari" value="1" />
            <div className="flex-1">
              <label htmlFor="itineraryId" className="label">
                Rencana perjalanan
              </label>
              <select
                id="itineraryId"
                name="itineraryId"
                defaultValue={itineraryId}
                className="input"
                required
              >
                <option value="">— Pilih rencana —</option>
                {itineraries.map((itinerary) => (
                  <option key={itinerary.id} value={itinerary.id}>
                    {itinerary.name} ({itinerary.segments.length} rute)
                  </option>
                ))}
              </select>
            </div>
            <SubmitButton variant="secondary">
              <Search className="size-4" aria-hidden />
              Cari dari rencana
            </SubmitButton>
          </form>
          {itineraries.length === 0 ? (
            <p className="mt-3 text-xs text-muted">
              Belum ada rencana tersimpan.{" "}
              <Link href="/member/rencana/baru" className="link">
                Buat rencana perjalanan
              </Link>
              .
            </p>
          ) : null}
        </section>

        <section className="card p-4 sm:p-5" aria-labelledby="cari-manual">
          <h2 id="cari-manual" className="section-title">
            Cari manual
          </h2>
          <p className="mt-1 text-xs text-muted">
            Isi hingga tiga segmen. Segmen kosong akan diabaikan.
          </p>
          <form method="get" className="mt-3 space-y-3">
            <input type="hidden" name="cari" value="1" />
            {[0, 1, 2].map((index) => (
              <Row
                key={index}
                index={index}
                airports={airports}
                defaults={defaults[index]}
              />
            ))}
            <SubmitButton>
              <Search className="size-4" aria-hidden />
              Cari semua segmen
            </SubmitButton>
          </form>
        </section>
      </div>

      {validationError ? (
        <Alert variant="warning" title="Kriteria pencarian belum valid">
          {validationError}
        </Alert>
      ) : null}

      {requested && segments.length > 0 && !validationError ? (
        <section className="space-y-4" aria-labelledby="hasil-multi">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 id="hasil-multi" className="section-title">
                Hasil multi-destinasi
              </h2>
              <p className="text-sm text-muted">
                {sourceLabel || `${segments.length} segmen perjalanan`}
              </p>
            </div>
            {totalCheapest !== null ? (
              <div className="rounded-xl border border-emerald-200 bg-green-soft px-4 py-2 text-sm text-emerald-900">
                Total termurah semua segmen:{" "}
                <strong className="text-base">{formatIDR(totalCheapest)}</strong>
              </div>
            ) : null}
          </div>

          <div className="space-y-4">
            {segments.map((segment, index) => {
              const flights = results[index];
              const cheapest = cheapestPerSegment[index];
              return (
                <article key={`${segment.originCode}-${segment.destinationCode}-${index}`} className="card p-4" data-testid="multi-segment-result">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex items-start gap-2">
                      <span className="flex size-7 items-center justify-center rounded-full bg-sky-soft text-xs font-bold text-sky">
                        {index + 1}
                      </span>
                      <div>
                        <h3 className="font-bold">
                          {segment.originCode} → {segment.destinationCode}
                        </h3>
                        <p className="flex items-center gap-1 text-xs text-muted">
                          <CalendarDays className="size-3" aria-hidden />
                          {formatDate(segment.date)}
                        </p>
                      </div>
                    </div>
                    {cheapest ? (
                      <span className="badge bg-green-soft text-emerald-800">
                        Termurah {formatIDR(cheapest.price)}
                      </span>
                    ) : (
                      <span className="badge bg-amber-soft text-amber-800">Tidak tersedia</span>
                    )}
                  </div>

                  {flights.length === 0 ? (
                    <p className="mt-3 rounded-xl border border-dashed border-line bg-canvas/50 p-3 text-xs text-muted">
                      Tidak ada penerbangan untuk segmen ini. Coba tanggal atau rute lain.
                    </p>
                  ) : (
                    <div className="mt-3 space-y-2">
                      {flights.slice(0, 3).map((flight) => {
                        const soldOut = flight.seatsAvailable <= 0;
                        return (
                          <div
                            key={flight.id}
                            className="flex flex-col gap-2 rounded-xl border border-line p-3 sm:flex-row sm:items-center sm:justify-between"
                          >
                            <div className="flex items-center gap-2">
                              <span className="flex size-8 items-center justify-center rounded-lg bg-navy text-[10px] font-bold text-white">
                                {flight.airline.code}
                              </span>
                              <div>
                                <p className="text-sm font-semibold">{flight.airline.name}</p>
                                <p className="text-[11px] text-muted">
                                  {formatTime(flight.departureAt)} → {formatTime(flight.arrivalAt)} ·{" "}
                                  {formatDuration(durationMinutes(flight.departureAt, flight.arrivalAt))}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span
                                className={`text-sm font-extrabold ${
                                  soldOut ? "text-muted line-through" : "text-navy"
                                }`}
                              >
                                {formatIDR(flight.price)}
                              </span>
                              {soldOut ? (
                                <span className="badge bg-red-soft text-red-700">Kursi habis</span>
                              ) : (
                                <Link
                                  href={`/penerbangan/${flight.id}`}
                                  className="btn-secondary btn-sm"
                                  aria-label={`Pilih ${flight.airline.name} ${flight.flightNumber}`}
                                >
                                  Pilih
                                  <ArrowRight className="size-3.5" aria-hidden />
                                </Link>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </article>
              );
            })}
          </div>

          <div className="flex items-start gap-2 rounded-xl bg-sky-soft/60 p-3 text-xs leading-relaxed text-navy">
            <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden />
            Total termurah dihitung dari harga terendah setiap segmen dan belum termasuk pemesanan.
            Pilih penerbangan pada tiap segmen untuk melihat detail.
          </div>
        </section>
      ) : null}

      {!requested ? (
        <EmptyState
          icon={Plane}
          title="Cari perjalanan multi-destinasi"
          description="Pilih rencana perjalanan yang tersimpan atau isi hingga tiga segmen secara manual untuk melihat jadwal dan harga tiap rute."
          action={
            <Link href="/member/rencana/baru" className="btn-secondary">
              <Plus className="size-4" aria-hidden />
              Buat rencana perjalanan
            </Link>
          }
        />
      ) : null}
    </div>
  );
}
