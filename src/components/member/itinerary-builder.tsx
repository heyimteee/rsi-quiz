"use client";

import { useActionState, useState } from "react";
import { CalendarDays, Plus, Route, Trash2 } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { SubmitButton } from "@/components/ui/submit-button";
import {
  createItineraryAction,
  type ItineraryActionState,
} from "@/lib/actions/member-actions";

const initialState: ItineraryActionState = {};

type AirportOption = { id: string; code: string; city: string };
type SegmentRow = { key: number; origin: string; destination: string; departureDate: string };

export function ItineraryBuilder({
  airports,
  defaultDate,
}: {
  airports: AirportOption[];
  defaultDate: string;
}) {
  const [state, formAction] = useActionState(createItineraryAction, initialState);
  const airportId = (code: string) => airports.find((airport) => airport.code === code)?.id ?? airports[0]?.id ?? "";
  const [segments, setSegments] = useState<SegmentRow[]>([
    { key: 1, origin: airportId("CGK"), destination: airportId("DPS"), departureDate: defaultDate },
    { key: 2, origin: airportId("DPS"), destination: airportId("SUB"), departureDate: defaultDate },
  ]);
  const [nextKey, setNextKey] = useState(3);

  function update(key: number, field: keyof Omit<SegmentRow, "key">, value: string) {
    setSegments((current) =>
      current.map((segment) => (segment.key === key ? { ...segment, [field]: value } : segment)),
    );
  }

  return (
    <form action={formAction} className="space-y-5" data-testid="itinerary-builder">
      {state.error ? <Alert variant="error">{state.error}</Alert> : null}

      <div>
        <label htmlFor="name" className="label">
          Nama rencana perjalanan
        </label>
        <input
          id="name"
          name="name"
          className="input"
          placeholder="Contoh: Liburan Bali–Surabaya"
          required
          minLength={3}
        />
        {state.fieldErrors?.name ? (
          <p className="mt-1 text-xs font-medium text-red-600">{state.fieldErrors.name}</p>
        ) : null}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="section-title">Rute perjalanan</h2>
            <p className="text-xs text-muted">Maksimal 4 rute. Tanggal harus berurutan.</p>
          </div>
          <button
            type="button"
            className="btn-secondary btn-sm"
            disabled={segments.length >= 4}
            onClick={() => {
              if (segments.length >= 4) return;
              setSegments((current) => [
                ...current,
                {
                  key: nextKey,
                  origin: airportId("SUB"),
                  destination: airportId("CGK"),
                  departureDate: defaultDate,
                },
              ]);
              setNextKey((key) => key + 1);
            }}
          >
            <Plus className="size-3.5" aria-hidden />
            Tambah rute
          </button>
        </div>

        <div className="space-y-3">
          {segments.map((segment, index) => (
            <fieldset
              key={segment.key}
              data-testid="itinerary-row"
              className="rounded-xl border border-line bg-canvas/40 p-3"
            >
              <legend className="px-1 text-xs font-bold uppercase tracking-wide text-muted">
                Rute {index + 1}
              </legend>
              <div className="grid gap-2 sm:grid-cols-[1fr_1fr_1fr_auto]">
                <div>
                  <label htmlFor={`origin-${segment.key}`} className="sr-only">
                    Kota asal rute {index + 1}
                  </label>
                  <select
                    id={`origin-${segment.key}`}
                    name="origin"
                    className="input"
                    value={segment.origin}
                    onChange={(event) => update(segment.key, "origin", event.target.value)}
                  >
                    {airports.map((airport) => (
                      <option key={airport.id} value={airport.id}>
                        {airport.city} ({airport.code})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor={`destination-${segment.key}`} className="sr-only">
                    Kota tujuan rute {index + 1}
                  </label>
                  <select
                    id={`destination-${segment.key}`}
                    name="destination"
                    className="input"
                    value={segment.destination}
                    onChange={(event) => update(segment.key, "destination", event.target.value)}
                  >
                    {airports.map((airport) => (
                      <option key={airport.id} value={airport.id}>
                        {airport.city} ({airport.code})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor={`date-${segment.key}`} className="sr-only">
                    Tanggal rute {index + 1}
                  </label>
                  <input
                    id={`date-${segment.key}`}
                    type="date"
                    name="departureDate"
                    className="input"
                    value={segment.departureDate}
                    onChange={(event) => update(segment.key, "departureDate", event.target.value)}
                    required
                  />
                </div>
                <button
                  type="button"
                  className="btn-ghost btn-sm text-red-600"
                  disabled={segments.length === 1}
                  onClick={() =>
                    setSegments((current) => current.filter((item) => item.key !== segment.key))
                  }
                  aria-label={`Hapus rute ${index + 1}`}
                >
                  <Trash2 className="size-4" aria-hidden />
                </button>
              </div>
            </fieldset>
          ))}
        </div>
      </div>

      <div className="flex items-start gap-2 rounded-xl bg-sky-soft/60 p-3 text-xs leading-relaxed text-navy">
        <Route className="mt-0.5 size-4 shrink-0" aria-hidden />
        Rencana perjalanan dapat digunakan untuk mencari penerbangan multi-destinasi setelah
        disimpan.
      </div>

      <SubmitButton pendingLabel="Menyimpan rencana…">
        <CalendarDays className="size-4" aria-hidden />
        Simpan rencana perjalanan
      </SubmitButton>
    </form>
  );
}
