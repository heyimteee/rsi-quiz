import type { Metadata } from "next";
import Link from "next/link";
import { addDays } from "date-fns";
import { ArrowLeftRight, CalendarDays, Plane, Search } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import { SubmitButton } from "@/components/ui/submit-button";
import { RoundTripSelector, type SelectableFlight } from "@/components/round-trip-selector";
import { requireRole } from "@/lib/auth/session";
import { getAirports, searchFlightOffers } from "@/lib/services/flight-service";
import type { FlightLike } from "@/lib/domain/flight";
import { validateReturnDate, validateTripCriteria } from "@/lib/domain/booking";
import { MESSAGES } from "@/lib/constants";
import { firstParam, formatDate, parseDateOnly, toDateInputValue, todayInputValue } from "@/lib/utils";

export const metadata: Metadata = { title: "Pemesanan Pulang-Pergi" };

type SearchParams = Promise<{
  asal?: string | string[];
  tujuan?: string | string[];
  berangkat?: string | string[];
  pulang?: string | string[];
  cari?: string | string[];
}>;

function toSelectable(flight: FlightLike): SelectableFlight {
  return {
    id: flight.id,
    flightNumber: flight.flightNumber,
    price: flight.price,
    departureAt: new Date(flight.departureAt).toISOString(),
    arrivalAt: new Date(flight.arrivalAt).toISOString(),
    seatsAvailable: flight.seatsAvailable,
    airline: { code: flight.airline.code, name: flight.airline.name },
    origin: { code: flight.origin.code, city: flight.origin.city },
    destination: { code: flight.destination.code, city: flight.destination.city },
  };
}

export default async function RoundTripPage({ searchParams }: { searchParams: SearchParams }) {
  await requireRole(["PASSENGER", "MEMBER"]);
  const params = await searchParams;
  const airports = await getAirports();
  const codes = new Set(airports.map((airport) => airport.code));

  const today = new Date();
  const defaultDeparture = addDays(today, 3);
  const defaultReturn = addDays(today, 6);
  const originCode = codes.has((firstParam(params.asal) ?? "").toUpperCase())
    ? (firstParam(params.asal) ?? "").toUpperCase()
    : "CGK";
  const destinationCode = codes.has((firstParam(params.tujuan) ?? "").toUpperCase())
    ? (firstParam(params.tujuan) ?? "").toUpperCase()
    : "DPS";
  const departureValue = parseDateOnly(firstParam(params.berangkat))
    ? (firstParam(params.berangkat) as string)
    : toDateInputValue(defaultDeparture);
  const returnValue = parseDateOnly(firstParam(params.pulang))
    ? (firstParam(params.pulang) as string)
    : toDateInputValue(defaultReturn);
  const departureDate = parseDateOnly(departureValue) ?? defaultDeparture;
  const returnDate = parseDateOnly(returnValue) ?? defaultReturn;
  const requested = firstParam(params.cari) === "1";

  const tripValidation = validateTripCriteria({ originCode, destinationCode });
  const dateValidation = validateReturnDate(departureDate, returnDate);
  const validationError = !tripValidation.valid
    ? tripValidation.message
    : !dateValidation.valid
      ? dateValidation.message
      : null;

  const [outboundFlights, returnFlights] = requested && !validationError
    ? await Promise.all([
        searchFlightOffers({
          originCode,
          destinationCode,
          date: departureDate,
          sort: "departure_asc",
        }),
        searchFlightOffers({
          originCode: destinationCode,
          destinationCode: originCode,
          date: returnDate,
          sort: "departure_asc",
        }),
      ])
    : [[], []];

  const noFlights = requested && !validationError && (outboundFlights.length === 0 || returnFlights.length === 0);
  const origin = airports.find((airport) => airport.code === originCode);
  const destination = airports.find((airport) => airport.code === destinationCode);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Studi Kasus 10 · Calon Penumpang"
        title="Pemesanan Tiket Pulang-Pergi"
        description="Tentukan lokasi keberangkatan, tujuan, tanggal berangkat, dan tanggal pulang. Sistem menampilkan pilihan penerbangan pulang-pergi beserta total harganya."
        actions={
          <Link href="/penerbangan" className="btn-secondary">
            <Plane className="size-4" aria-hidden />
            Tiket sekali jalan
          </Link>
        }
      />

      <section className="card p-4 sm:p-5" aria-label="Form pencarian pulang-pergi">
        <form method="get" className="grid gap-3 lg:grid-cols-[1fr_1fr_1fr_1fr_auto]">
          <input type="hidden" name="cari" value="1" />
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
            <label htmlFor="berangkat" className="label">
              Tanggal berangkat
            </label>
            <input
              id="berangkat"
              name="berangkat"
              type="date"
              defaultValue={departureValue}
              min={todayInputValue()}
              className="input"
            />
          </div>
          <div>
            <label htmlFor="pulang" className="label">
              Tanggal pulang
            </label>
            <input
              id="pulang"
              name="pulang"
              type="date"
              defaultValue={returnValue}
              min={departureValue}
              className="input"
            />
          </div>
          <div className="flex items-end">
            <SubmitButton className="w-full lg:w-auto">
              <Search className="size-4" aria-hidden />
              Cari pulang-pergi
            </SubmitButton>
          </div>
        </form>
        <p className="helper flex items-center gap-1.5">
          <CalendarDays className="size-3.5" aria-hidden />
          Tanggal pulang harus sama atau setelah tanggal berangkat.
        </p>
      </section>

      {validationError ? (
        <Alert variant="error" title="Kriteria perjalanan belum valid">
          {validationError}
        </Alert>
      ) : null}

      {noFlights ? (
        <Alert variant="warning" title="Penerbangan tidak tersedia">
          {MESSAGES.NO_FLIGHTS}
        </Alert>
      ) : null}

      {requested && !validationError && !noFlights ? (
        <section className="space-y-4" aria-labelledby="hasil-pp">
          <div className="flex flex-col gap-1">
            <h2 id="hasil-pp" className="section-title">
              Pilih penerbangan pulang-pergi
            </h2>
            <p className="flex items-center gap-1.5 text-sm text-muted">
              <ArrowLeftRight className="size-4" aria-hidden />
              {origin?.city} ({originCode}) → {destination?.city} ({destinationCode}) ·{" "}
              {formatDate(departureDate)} – {formatDate(returnDate)}
            </p>
          </div>
          <RoundTripSelector
            outboundFlights={outboundFlights.map(toSelectable)}
            returnFlights={returnFlights.map(toSelectable)}
          />
        </section>
      ) : null}

      {!requested ? (
        <EmptyState
          icon={Plane}
          title="Siap merencanakan perjalanan pulang-pergi?"
          description="Isi kriteria perjalanan di atas, lalu sistem akan menampilkan pilihan penerbangan keberangkatan dan kepulangan."
        />
      ) : null}
    </div>
  );
}
