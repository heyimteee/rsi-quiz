import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BadgeCheck, Clock3, Search, SlidersHorizontal, TrendingDown } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { EmptyState } from "@/components/ui/empty-state";
import { SubmitButton } from "@/components/ui/submit-button";
import { Alert } from "@/components/ui/alert";
import { requireRole } from "@/lib/auth/session";
import { getAirports, searchFlightOffers } from "@/lib/services/flight-service";
import { getCheapestFlight, summarizeFlights } from "@/lib/domain/flight";
import {
  durationMinutes,
  firstParam,
  formatDate,
  formatDuration,
  formatIDR,
  formatTime,
  parseDateOnly,
  toDateInputValue,
  todayInputValue,
} from "@/lib/utils";
import { addDays } from "date-fns";

export const metadata: Metadata = { title: "Cari & Bandingkan Penerbangan" };

type SearchParams = Promise<{
  asal?: string | string[];
  tujuan?: string | string[];
  tanggal?: string | string[];
  dariJam?: string | string[];
  sampaiJam?: string | string[];
  urutkan?: string | string[];
}>;

const sortOptions = [
  { value: "price_asc", label: "Harga terendah" },
  { value: "price_desc", label: "Harga tertinggi" },
  { value: "departure_asc", label: "Keberangkatan terawal" },
  { value: "duration_asc", label: "Durasi tercepat" },
] as const;

export default async function MemberFlightSearchPage({ searchParams }: { searchParams: SearchParams }) {
  await requireRole("MEMBER");
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
  const timeFrom = firstParam(params.dariJam) ?? "";
  const timeTo = firstParam(params.sampaiJam) ?? "";
  const sort = sortOptions.some((option) => option.value === firstParam(params.urutkan))
    ? (firstParam(params.urutkan) as (typeof sortOptions)[number]["value"])
    : "price_asc";

  const validRoute = originCode !== destinationCode;
  const flights = validRoute
    ? await searchFlightOffers({
        originCode,
        destinationCode,
        date,
        timeFrom: timeFrom || null,
        timeTo: timeTo || null,
        sort,
      })
    : [];
  const available = flights.filter((flight) => flight.seatsAvailable > 0);
  const summary = summarizeFlights(available);
  const cheapest = getCheapestFlight(available);
  const origin = airports.find((airport) => airport.code === originCode);
  const destination = airports.find((airport) => airport.code === destinationCode);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Studi Kasus 06 · Member Frequent Traveller"
        title="Cari & Bandingkan Penerbangan"
        description="Cari penerbangan berdasarkan tujuan, tanggal, dan jam keberangkatan, lalu bandingkan harga tiket dari maskapai yang tersedia."
        actions={
          <Link href="/penerbangan" className="btn-secondary">
            <Search className="size-4" aria-hidden />
            Pencarian umum
          </Link>
        }
      />

      <section className="card p-4 sm:p-5" aria-label="Preferensi penerbangan">
        <form method="get" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
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
            <label htmlFor="dariJam" className="label">
              Jam dari
            </label>
            <input
              id="dariJam"
              name="dariJam"
              type="time"
              defaultValue={timeFrom}
              className="input"
            />
          </div>
          <div>
            <label htmlFor="sampaiJam" className="label">
              Jam sampai
            </label>
            <input
              id="sampaiJam"
              name="sampaiJam"
              type="time"
              defaultValue={timeTo}
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
          <div className="flex items-end sm:col-span-2 lg:col-span-3 xl:col-span-6">
            <SubmitButton>
              <Search className="size-4" aria-hidden />
              Cari penerbangan
            </SubmitButton>
          </div>
        </form>
      </section>

      {!validRoute ? (
        <Alert variant="warning" title="Rute belum valid">
          Kota keberangkatan dan tujuan tidak boleh sama.
        </Alert>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-3" aria-label="Ringkasan hasil">
        <StatCard label="Penerbangan tersedia" value={available.length} icon={BadgeCheck} tone="sky" />
        <StatCard
          label="Harga termurah"
          value={cheapest ? formatIDR(cheapest.price) : "—"}
          icon={TrendingDown}
          tone="green"
        />
        <StatCard
          label="Durasi tercepat"
          value={summary.count ? formatDuration(summary.fastestMinutes) : "—"}
          icon={Clock3}
          tone="amber"
        />
      </section>

      {flights.length === 0 ? (
        <EmptyState
          icon={Search}
          title="Penerbangan tidak ditemukan"
          description="Tidak ada penerbangan yang sesuai dengan tujuan, tanggal, dan jam keberangkatan yang dipilih."
          action={
            <Link href="/member/penerbangan" className="btn-secondary">
              Reset preferensi
            </Link>
          }
        />
      ) : (
        <section className="space-y-3" aria-labelledby="perbandingan-harga">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 id="perbandingan-harga" className="section-title">
                Perbandingan harga tiket
              </h2>
              <p className="text-sm text-muted">
                {origin?.city} ({originCode}) → {destination?.city} ({destinationCode}) ·{" "}
                {formatDate(date)}
                {timeFrom || timeTo ? ` · ${timeFrom || "00:00"}–${timeTo || "23:59"}` : ""}
              </p>
            </div>
            <span className="flex items-center gap-1.5 text-xs text-muted">
              <SlidersHorizontal className="size-3.5" aria-hidden />
              {sortOptions.find((option) => option.value === sort)?.label}
            </span>
          </div>

          <div className="table-wrap">
            <table className="data-table">
              <caption className="sr-only">
                Perbandingan harga tiket penerbangan {originCode} ke {destinationCode}
              </caption>
              <thead>
                <tr>
                  <th scope="col">Maskapai</th>
                  <th scope="col">Jadwal</th>
                  <th scope="col">Durasi</th>
                  <th scope="col">Harga</th>
                  <th scope="col">Selisih</th>
                  <th scope="col" className="text-right">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody>
                {flights.map((flight) => {
                  const isCheapest = cheapest?.id === flight.id;
                  const soldOut = flight.seatsAvailable <= 0;
                  return (
                    <tr
                      key={flight.id}
                      data-testid="member-flight-row"
                      className={isCheapest ? "bg-green-soft/40" : undefined}
                    >
                      <td>
                        <p className="font-semibold">{flight.airline.name}</p>
                        <p className="text-xs text-muted">{flight.flightNumber}</p>
                      </td>
                      <td className="whitespace-nowrap">
                        <span className="font-semibold">{formatTime(flight.departureAt)}</span>
                        <span className="mx-1 text-muted">→</span>
                        {formatTime(flight.arrivalAt)}
                      </td>
                      <td>{formatDuration(durationMinutes(flight.departureAt, flight.arrivalAt))}</td>
                      <td>
                        <p className={`font-bold ${soldOut ? "text-muted line-through" : "text-navy"}`}>
                          {formatIDR(flight.price)}
                        </p>
                        <p className="text-[10px] text-muted">
                          {soldOut ? "Kursi habis" : `${flight.seatsAvailable} kursi`}
                        </p>
                      </td>
                      <td>
                        {soldOut ? (
                          <span className="badge bg-red-soft text-red-700">Tidak tersedia</span>
                        ) : isCheapest ? (
                          <span className="badge bg-green-soft text-emerald-800">Termurah</span>
                        ) : cheapest ? (
                          <span className="text-xs text-muted">
                            +{formatIDR(flight.price - cheapest.price)}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="text-right">
                        {soldOut ? (
                          <span className="text-xs text-muted">Tidak tersedia</span>
                        ) : (
                          <Link
                            href={`/penerbangan/${flight.id}`}
                            className="btn-primary btn-sm"
                            aria-label={`Pesan ${flight.airline.name} ${flight.flightNumber}`}
                          >
                            Pesan
                            <ArrowRight className="size-3.5" aria-hidden />
                          </Link>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted">
            Selisih dihitung terhadap harga termurah pada rute dan tanggal yang dipilih. Harga
            sudah termasuk pajak.
          </p>
        </section>
      )}
    </div>
  );
}
