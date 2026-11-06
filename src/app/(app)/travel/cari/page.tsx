import type { Metadata } from "next";
import Link from "next/link";
import { addDays } from "date-fns";
import { ClipboardList, Plane, Search } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { SubmitButton } from "@/components/ui/submit-button";
import { FlightCard } from "@/components/flight-card";
import { requireRole } from "@/lib/auth/session";
import { getAirports, searchFlightOffers } from "@/lib/services/flight-service";
import {
  firstParam,
  formatLongDate,
  parseDateOnly,
  toDateInputValue,
  todayInputValue,
} from "@/lib/utils";

export const metadata: Metadata = { title: "Pesan untuk Pengunjung" };

type SearchParams = Promise<{
  asal?: string | string[];
  tujuan?: string | string[];
  tanggal?: string | string[];
}>;

export default async function TravelFlightSearchPage({ searchParams }: { searchParams: SearchParams }) {
  await requireRole("TRAVEL_MANAGER");
  const params = await searchParams;
  const airports = await getAirports();
  const codes = new Set(airports.map((airport) => airport.code));

  const originCode = codes.has((firstParam(params.asal) ?? "").toUpperCase())
    ? (firstParam(params.asal) ?? "").toUpperCase()
    : "CGK";
  const destinationCode = codes.has((firstParam(params.tujuan) ?? "").toUpperCase())
    ? (firstParam(params.tujuan) ?? "").toUpperCase()
    : "DPS";
  const dateValue = parseDateOnly(firstParam(params.tanggal))
    ? (firstParam(params.tanggal) as string)
    : toDateInputValue(addDays(new Date(), 1));
  const date = parseDateOnly(dateValue) ?? addDays(new Date(), 1);

  const flights =
    originCode === destinationCode
      ? []
      : await searchFlightOffers({ originCode, destinationCode, date, sort: "departure_asc" });
  const origin = airports.find((airport) => airport.code === originCode);
  const destination = airports.find((airport) => airport.code === destinationCode);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Studi Kasus 08 · Manajer Travel"
        title="Pesan Tiket untuk Pengunjung"
        description="Cari penerbangan sesuai kebutuhan pengunjung, lalu pesan tiket menggunakan data identitas pengunjung yang tersimpan."
        actions={
          <Link href="/travel/pemesanan" className="btn-secondary">
            <ClipboardList className="size-4" aria-hidden />
            Status pemesanan
          </Link>
        }
      />

      <section className="card p-4 sm:p-5" aria-label="Pencarian penerbangan untuk pengunjung">
        <form method="get" className="grid gap-3 lg:grid-cols-[1fr_1fr_1fr_auto]">
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
            <label htmlFor="tujuan" className="label">
              Tujuan
            </label>
            <select id="tujuan" name="tujuan" defaultValue={destinationCode} className="input">
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
              <Search className="size-4" aria-hidden />
              Cari tiket
            </SubmitButton>
          </div>
        </form>
      </section>

      {originCode === destinationCode ? (
        <EmptyState
          icon={Plane}
          title="Rute belum valid"
          description="Kota keberangkatan dan tujuan tidak boleh sama."
        />
      ) : (
        <section className="space-y-3" aria-labelledby="hasil-travel">
          <div>
            <h2 id="hasil-travel" className="section-title">
              {flights.length} penerbangan tersedia
            </h2>
            <p className="text-sm text-muted">
              {origin?.city} ({originCode}) → {destination?.city} ({destinationCode}) ·{" "}
              {formatLongDate(date)}
            </p>
          </div>

          {flights.length === 0 ? (
            <EmptyState
              icon={Plane}
              title="Penerbangan tidak tersedia"
              description="Tidak ada penerbangan yang cocok. Coba tanggal atau tujuan lain."
            />
          ) : (
            <div className="grid gap-3 xl:grid-cols-2">
              {flights.map((flight) => (
                <FlightCard
                  key={flight.id}
                  flight={flight}
                  href={`/travel/pesan/${flight.id}`}
                  actionLabel="Pesan untuk pengunjung"
                />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
