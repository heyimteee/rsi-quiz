import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeftRight, CalendarDays, Plane, Search, TrendingDown } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import { SubmitButton } from "@/components/ui/submit-button";
import { FlightCard } from "@/components/flight-card";
import { requireRole } from "@/lib/auth/session";
import { getAirports, searchFlightOffers } from "@/lib/services/flight-service";
import { getCheapestFlight, summarizeFlights } from "@/lib/domain/flight";
import {
  firstParam,
  formatDate,
  formatDuration,
  formatIDR,
  parseDateOnly,
  todayInputValue,
} from "@/lib/utils";

export const metadata: Metadata = { title: "Bandingkan Dua Tujuan" };

type SearchParams = Promise<{
  asal?: string | string[];
  tujuan1?: string | string[];
  tujuan2?: string | string[];
  tanggal?: string | string[];
}>;

export default async function CompareDestinationsPage({ searchParams }: { searchParams: SearchParams }) {
  await requireRole(["PASSENGER", "MEMBER"]);
  const params = await searchParams;
  const airports = await getAirports();
  const codes = new Set(airports.map((airport) => airport.code));

  const originCode = codes.has((firstParam(params.asal) ?? "").toUpperCase())
    ? (firstParam(params.asal) ?? "").toUpperCase()
    : "CGK";
  const destination1 = codes.has((firstParam(params.tujuan1) ?? "").toUpperCase())
    ? (firstParam(params.tujuan1) ?? "").toUpperCase()
    : "DPS";
  const destination2 = codes.has((firstParam(params.tujuan2) ?? "").toUpperCase())
    ? (firstParam(params.tujuan2) ?? "").toUpperCase()
    : "SUB";
  const dateValue = parseDateOnly(firstParam(params.tanggal)) ? (firstParam(params.tanggal) as string) : todayInputValue();
  const date = parseDateOnly(dateValue) ?? new Date();

  const validationError =
    originCode === destination1 || originCode === destination2
      ? "Kota asal harus berbeda dengan kedua tujuan."
      : destination1 === destination2
        ? "Pilih dua tujuan yang berbeda untuk dibandingkan."
        : null;

  const [flights1, flights2] = validationError
    ? [[], []]
    : await Promise.all([
        searchFlightOffers({ originCode, destinationCode: destination1, date, sort: "price_asc" }),
        searchFlightOffers({ originCode, destinationCode: destination2, date, sort: "price_asc" }),
      ]);

  const summary1 = summarizeFlights(flights1);
  const summary2 = summarizeFlights(flights2);
  const cheapest1 = getCheapestFlight(flights1);
  const cheapest2 = getCheapestFlight(flights2);
  const airport1 = airports.find((airport) => airport.code === destination1);
  const airport2 = airports.find((airport) => airport.code === destination2);

  const difference =
    cheapest1 && cheapest2 ? Math.abs(cheapest1.price - cheapest2.price) : null;
  const cheaperDestination =
    cheapest1 && cheapest2
      ? cheapest1.price < cheapest2.price
        ? airport1
        : cheapest1.price > cheapest2.price
          ? airport2
          : null
      : null;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Studi Kasus 03 · Calon Penumpang"
        title="Bandingkan Dua Tujuan"
        description="Masukkan dua tujuan alternatif pada tanggal yang sama. Sistem menampilkan jadwal, maskapai, harga, dan tujuan dengan harga termurah."
        actions={
          <Link href="/penerbangan" className="btn-secondary">
            <Search className="size-4" aria-hidden />
            Pencarian biasa
          </Link>
        }
      />

      <section className="card p-4 sm:p-5" aria-label="Form perbandingan tujuan">
        <form method="get" className="grid gap-3 lg:grid-cols-[1fr_1fr_1fr_1fr_auto]">
          <div>
            <label htmlFor="asal" className="label">
              Dari
            </label>
            <select id="asal" name="asal" defaultValue={originCode} className="input">
              {airports.map((airport) => (
                <option key={airport.code} value={airport.code}>
                  {airport.city} ({airport.code})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="tujuan1" className="label">
              Tujuan pertama
            </label>
            <select id="tujuan1" name="tujuan1" defaultValue={destination1} className="input">
              {airports.map((airport) => (
                <option key={airport.code} value={airport.code}>
                  {airport.city} ({airport.code})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="tujuan2" className="label">
              Tujuan kedua
            </label>
            <select id="tujuan2" name="tujuan2" defaultValue={destination2} className="input">
              {airports.map((airport) => (
                <option key={airport.code} value={airport.code}>
                  {airport.city} ({airport.code})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="tanggal" className="label">
              Tanggal berangkat
            </label>
            <input
              id="tanggal"
              name="tanggal"
              type="date"
              defaultValue={dateValue}
              min={todayInputValue()}
              className="input"
            />
          </div>
          <div className="flex items-end">
            <SubmitButton className="w-full lg:w-auto">
              <ArrowLeftRight className="size-4" aria-hidden />
              Bandingkan
            </SubmitButton>
          </div>
        </form>
      </section>

      {validationError ? (
        <Alert variant="warning" title="Kriteria belum valid">
          {validationError}
        </Alert>
      ) : null}

      {cheaperDestination && difference !== null && difference > 0 ? (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-emerald-200 bg-green-soft px-4 py-3 text-sm text-emerald-900">
          <TrendingDown className="size-5 shrink-0" aria-hidden />
          <p>
            <strong>{cheaperDestination.city}</strong> lebih murah{" "}
            <strong>{formatIDR(difference)}</strong> dibanding tujuan lainnya untuk tanggal{" "}
            {formatDate(date)}.
          </p>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2" data-testid="compare-grid">
        {[
          { airport: airport1, code: destination1, flights: flights1, summary: summary1, cheapest: cheapest1 },
          { airport: airport2, code: destination2, flights: flights2, summary: summary2, cheapest: cheapest2 },
        ].map((column, columnIndex) => (
          <section
            key={`${column.code}-${columnIndex}`}
            data-testid="compare-column"
            className="space-y-3"
            aria-labelledby={`tujuan-${column.code}`}
          >
            <div className="card p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="eyebrow">Tujuan</p>
                  <h2 id={`tujuan-${column.code}`} className="text-lg font-extrabold">
                    {column.airport?.city ?? column.code}{" "}
                    <span className="text-sm font-medium text-muted">({column.code})</span>
                  </h2>
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-muted">
                    <CalendarDays className="size-3.5" aria-hidden />
                    {formatDate(date)}
                  </p>
                </div>
                <span className="badge bg-sky-soft text-sky">{column.summary.count} penerbangan</span>
              </div>
              {column.summary.count > 0 ? (
                <dl className="mt-3 grid grid-cols-3 gap-2 border-t border-line pt-3 text-center">
                  <div>
                    <dt className="text-[10px] uppercase tracking-wide text-muted">Termurah</dt>
                    <dd className="mt-0.5 text-sm font-extrabold text-navy">
                      {formatIDR(column.summary.minPrice)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[10px] uppercase tracking-wide text-muted">Tercepat</dt>
                    <dd className="mt-0.5 text-sm font-bold">
                      {formatDuration(column.summary.fastestMinutes)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[10px] uppercase tracking-wide text-muted">Maskapai</dt>
                    <dd className="mt-0.5 text-sm font-bold">
                      {new Set(column.flights.map((flight) => flight.airline.code)).size} pilihan
                    </dd>
                  </div>
                </dl>
              ) : null}
            </div>

            {column.flights.length === 0 ? (
              <EmptyState
                icon={Plane}
                title={`Tidak ada penerbangan ke ${column.airport?.city ?? column.code}`}
                description="Coba tanggal lain atau pilih tujuan alternatif."
                className="py-10"
              />
            ) : (
              <div className="space-y-2">
                {column.flights.slice(0, 4).map((flight) => (
                  <FlightCard
                    key={flight.id}
                    flight={flight}
                    href={`/penerbangan/${flight.id}`}
                    actionLabel="Pilih"
                    compact
                    highlight={column.cheapest?.id === flight.id}
                  />
                ))}
              </div>
            )}
            <Link
              href={`/penerbangan?asal=${originCode}&tujuan=${column.code}&tanggal=${dateValue}`}
              className="btn-secondary btn-sm w-full"
            >
              Lihat semua penerbangan ke {column.airport?.city ?? column.code}
            </Link>
          </section>
        ))}
      </div>
    </div>
  );
}
