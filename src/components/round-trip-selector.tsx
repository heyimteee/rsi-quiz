"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Clock3, PlaneTakeoff } from "lucide-react";
import { cn, formatIDR, formatTime } from "@/lib/utils";

export type SelectableFlight = {
  id: string;
  flightNumber: string;
  price: number;
  departureAt: string;
  arrivalAt: string;
  seatsAvailable: number;
  airline: { code: string; name: string };
  origin: { code: string; city: string };
  destination: { code: string; city: string };
};

function durationLabel(departureAt: string, arrivalAt: string) {
  const minutes = Math.max(
    0,
    Math.round((new Date(arrivalAt).getTime() - new Date(departureAt).getTime()) / 60000),
  );
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours} jam` : `${hours}j ${rest}m`;
}

function Option({
  flight,
  selected,
  onSelect,
  testId,
}: {
  flight: SelectableFlight;
  selected: boolean;
  onSelect: () => void;
  testId: string;
}) {
  return (
    <label
      data-testid={testId}
      className={cn(
        "flex cursor-pointer gap-3 rounded-xl border p-3 transition",
        selected ? "border-sky bg-sky-soft/50 ring-2 ring-sky/15" : "border-line bg-white hover:border-sky/40",
      )}
    >
      <input
        type="radio"
        checked={selected}
        onChange={onSelect}
        className="mt-1 size-4 accent-sky"
        aria-label={`Pilih ${flight.airline.name} ${flight.flightNumber}`}
      />
      <span className="min-w-0 flex-1">
        <span className="flex items-start justify-between gap-2">
          <span>
            <span className="block text-xs font-bold text-ink">{flight.airline.name}</span>
            <span className="block text-[10px] text-muted">{flight.flightNumber}</span>
          </span>
          <span className="shrink-0 text-sm font-extrabold text-navy">{formatIDR(flight.price)}</span>
        </span>
        <span className="mt-2 flex items-center gap-1.5 text-xs">
          <span className="font-bold">{formatTime(flight.departureAt)}</span>
          <span className="text-muted">{flight.origin.code}</span>
          <ArrowRight className="size-3 text-muted" aria-hidden />
          <span className="font-bold">{formatTime(flight.arrivalAt)}</span>
          <span className="text-muted">{flight.destination.code}</span>
        </span>
        <span className="mt-1 flex items-center gap-1 text-[10px] text-muted">
          <Clock3 className="size-3" aria-hidden />
          {durationLabel(flight.departureAt, flight.arrivalAt)}
          <PlaneTakeoff className="ml-1 size-3 text-sky" aria-hidden />
          langsung
        </span>
      </span>
    </label>
  );
}

export function RoundTripSelector({
  outboundFlights,
  returnFlights,
}: {
  outboundFlights: SelectableFlight[];
  returnFlights: SelectableFlight[];
}) {
  const router = useRouter();
  const [outboundId, setOutboundId] = useState<string | null>(null);
  const [returnId, setReturnId] = useState<string | null>(null);
  const outbound = outboundFlights.find((flight) => flight.id === outboundId) ?? null;
  const inbound = returnFlights.find((flight) => flight.id === returnId) ?? null;
  const total = (outbound?.price ?? 0) + (inbound?.price ?? 0);

  return (
    <div className="space-y-4" data-testid="roundtrip-selector">
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="space-y-2" aria-labelledby="keberangkatan">
          <div>
            <h2 id="keberangkatan" className="section-title">
              Pilih penerbangan keberangkatan
            </h2>
            <p className="text-xs text-muted">{outboundFlights.length} penerbangan tersedia</p>
          </div>
          <div className="space-y-2">
            {outboundFlights.map((flight) => (
              <Option
                key={flight.id}
                flight={flight}
                selected={outboundId === flight.id}
                onSelect={() => setOutboundId(flight.id)}
                testId="outbound-option"
              />
            ))}
          </div>
        </section>

        <section className="space-y-2" aria-labelledby="kepulangan">
          <div>
            <h2 id="kepulangan" className="section-title">
              Pilih penerbangan kepulangan
            </h2>
            <p className="text-xs text-muted">{returnFlights.length} penerbangan tersedia</p>
          </div>
          <div className="space-y-2">
            {returnFlights.map((flight) => (
              <Option
                key={flight.id}
                flight={flight}
                selected={returnId === flight.id}
                onSelect={() => setReturnId(flight.id)}
                testId="return-option"
              />
            ))}
          </div>
        </section>
      </div>

      <div className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Total pulang-pergi</p>
          <p className="text-xl font-extrabold text-navy">{formatIDR(total)}</p>
          <p className="text-[11px] text-muted">
            {outbound && inbound
              ? `${outbound.origin.code} → ${outbound.destination.code} · ${inbound.origin.code} → ${inbound.destination.code}`
              : "Pilih satu penerbangan keberangkatan dan satu kepulangan."}
          </p>
        </div>
        <button
          type="button"
          className="btn-primary"
          disabled={!outbound || !inbound}
          onClick={() => {
            if (!outbound || !inbound) return;
            router.push(`/pulang-pergi/penumpang?outbound=${outbound.id}&return=${inbound.id}`);
          }}
        >
          Lanjut ke data penumpang
          <ArrowRight className="size-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}
