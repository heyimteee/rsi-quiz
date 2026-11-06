import Link from "next/link";
import { ArrowRight, Clock3, PlaneTakeoff, Users } from "lucide-react";
import type { FlightLike } from "@/lib/domain/flight";
import { cn, durationMinutes, formatDate, formatDuration, formatIDR, formatTime } from "@/lib/utils";

export function FlightCard({
  flight,
  href,
  actionLabel = "Pilih penerbangan",
  compact = false,
  highlight = false,
}: {
  flight: FlightLike;
  href?: string;
  actionLabel?: string;
  compact?: boolean;
  highlight?: boolean;
}) {
  const soldOut = flight.seatsAvailable <= 0;
  return (
    <article
      data-testid="flight-card"
      data-flight-id={flight.id}
      className={cn(
        "card flex flex-col p-4",
        highlight && "ring-2 ring-sky/40",
        compact && "p-3.5",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-xl bg-navy text-[11px] font-bold text-white">
            {flight.airline.code}
          </span>
          <div>
            <p className="text-sm font-bold leading-tight">{flight.airline.name}</p>
            <p className="text-[11px] text-muted">
              {flight.flightNumber} · {formatDate(flight.departureAt)}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-base font-extrabold tracking-tight text-navy">{formatIDR(flight.price)}</p>
          <p className="text-[10px] text-muted">per penumpang</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <div>
          <p className="text-lg font-extrabold leading-none">{formatTime(flight.departureAt)}</p>
          <p className="mt-1 text-xs font-semibold text-muted">{flight.origin.code}</p>
          <p className="text-[10px] text-muted">{flight.origin.city}</p>
        </div>
        <div className="flex min-w-20 flex-col items-center gap-1 text-muted">
          <span className="flex items-center gap-1 text-[10px]">
            <Clock3 className="size-3" aria-hidden />
            {formatDuration(durationMinutes(flight.departureAt, flight.arrivalAt))}
          </span>
          <span className="flex w-full items-center gap-1">
            <span className="h-px flex-1 bg-line" />
            <PlaneTakeoff className="size-3.5 rotate-45 text-sky" aria-hidden />
            <span className="h-px flex-1 bg-line" />
          </span>
          <span className="text-[10px]">langsung</span>
        </div>
        <div className="text-right">
          <p className="text-lg font-extrabold leading-none">{formatTime(flight.arrivalAt)}</p>
          <p className="mt-1 text-xs font-semibold text-muted">{flight.destination.code}</p>
          <p className="text-[10px] text-muted">{flight.destination.city}</p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-line/70 pt-3">
        <span
          className={cn(
            "flex items-center gap-1 text-[11px]",
            soldOut ? "font-semibold text-red-600" : "text-muted",
          )}
        >
          <Users className="size-3.5" aria-hidden />
          {soldOut ? "Kursi habis" : `${flight.seatsAvailable} kursi tersedia`}
        </span>
        {href ? (
          <Link
            href={href}
            className="btn-primary btn-sm"
            aria-label={`${actionLabel} ${flight.airline.name} ${flight.flightNumber}`}
          >
            {actionLabel}
            <ArrowRight className="size-3.5" aria-hidden />
          </Link>
        ) : null}
      </div>
    </article>
  );
}
