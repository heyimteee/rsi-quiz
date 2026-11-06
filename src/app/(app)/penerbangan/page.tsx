import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeftRight, Plane, Search, SlidersHorizontal } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import { SubmitButton } from "@/components/ui/submit-button";
import { FlightCard } from "@/components/flight-card";
import { requireRole } from "@/lib/auth/session";
import { getAirports, searchFlightOffers } from "@/lib/services/flight-service";
import { validateTripCriteria } from "@/lib/domain/booking";
import { firstParam, formatLongDate, parseDateOnly, todayInputValue } from "@/lib/utils";

export const metadata: Metadata = { title: "Cari Penerbangan" };

type SearchParams = Promise<{
  asal?: string | string[];
  tujuan?: string | string[];
  tanggal?: string | string[];
  urutkan?: string | string[];
}>;

const sortOptions = [
  { value: "departure_asc", label: "Keberangkatan paling awal" },
  { value: "price_asc", label: "Harga terendah" },
  { value: "price_desc", label: "Harga tertinggi" },
  { value: "duration_asc", label: "Durasi tercepat" },
] as const;

export default async function FlightSearchPage({ searchParams }: { searchParams: SearchParams }) {
  await requireRole(["PASSENGER", "MEMBER"]);
  const params = await searchParams;
  const airports = await getAirports();
  const codes = new Set(airports.map((airport) => airport.code));

  const originCode = codes.has((firstParam(params.asal) ?? "").toUpperCase())
    ? (firstParam(params.asal) ?? "").toUpperCase()
    : "CGK";
  const destinationCode = codes.has((firstParam(params.tujuan) ?? "").toUpperCase())
    ? (firstParam(params.tujuan) ?? "").toUpperCase()
    : "DPS";
  const dateValue = parseDateOnly(firstParam(params.tanggal)) ? (firstParam(params.tanggal) as string) : todayInputValue();
  const date = parseDateOnly(dateValue) ?? new Date();
  const sort = sortOptions.some((option) => option.value === firstParam(params.urutkan))
    ? (firstParam(params.urutkan) as (typeof sortOptions)[number]["value"])
    : "departure_asc";

  const criteria = validateTripCriteria({ originCode, destinationCode });
  const flights = criteria.valid
    ? await searchFlightOffers({ originCode, destinationCode, date, sort })
    : [];

  const origin = airports.find((airport) => airport.code === originCode);
  const destination = airports.find((airport) => airport.code === destinationCode);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Studi Kasus 02 · Calon Penumpang"
        title="Cari Jadwal Penerbangan"
        description="Temukan penerbangan berdasarkan rute dan tanggal keberangkatan, lalu lihat maskapai, jadwal, dan harga tiket sebelum memesan."
        actions={
          <Link href="/penerbangan/bandingkan" className="btn-secondary">
            <ArrowLeftRight className="size-4" aria-hidden />
            Bandingkan dua tujuan
          </Link>
        }
      />

      <section className="card p-4 sm:p-5" aria-label="Form pencarian penerbangan">
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
          <div>
            <label htmlFor="urutkan" className="label">
              Urutkan
            </label>
            <select id="urutkan" name="urutkan" defaultValue={sort} className="input">
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <SubmitButton className="w-full lg:w-auto">
              <Search className="size-4" aria-hidden />
              Cari
            </SubmitButton>
          </div>
        </form>
      </section>

      {!criteria.valid ? (
        <Alert variant="warning" title="Rute belum lengkap">
          {criteria.message}
        </Alert>
      ) : (
        <section className="space-y-3" aria-labelledby="hasil-penerbangan">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 id="hasil-penerbangan" className="section-title">
                {flights.length} penerbangan ditemukan
              </h2>
              <p className="text-sm text-muted">
                {origin?.city} ({originCode}) → {destination?.city} ({destinationCode}) ·{" "}
                {formatLongDate(date)}
              </p>
            </div>
            <span className="flex items-center gap-1.5 text-xs text-muted">
              <SlidersHorizontal className="size-3.5" aria-hidden />
              {sortOptions.find((option) => option.value === sort)?.label}
            </span>
          </div>

          {flights.length === 0 ? (
            <EmptyState
              icon={Plane}
              title="Penerbangan tidak tersedia"
              description="Tidak ada penerbangan yang cocok dengan rute dan tanggal yang dipilih. Coba tanggal atau tujuan lain."
              action={
                <Link href="/penerbangan" className="btn-secondary">
                  Mulai pencarian baru
                </Link>
              }
            />
          ) : (
            <div className="grid gap-3 xl:grid-cols-2">
              {flights.map((flight) => (
                <FlightCard
                  key={flight.id}
                  flight={flight}
                  href={`/penerbangan/${flight.id}`}
                  actionLabel="Lihat & pesan"
                />
              ))}
            </div>
          )}
        </section>
      )}

      <p className="text-xs leading-relaxed text-muted">
        Harga tiket ditampilkan per penumpang dan sudah termasuk pajak. Ketersediaan kursi dapat
        berubah hingga pemesanan dikonfirmasi.
      </p>
    </div>
  );
}
