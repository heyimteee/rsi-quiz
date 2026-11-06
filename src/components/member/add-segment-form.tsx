"use client";

import { useActionState } from "react";
import { Plus } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { SubmitButton } from "@/components/ui/submit-button";
import {
  addItinerarySegmentAction,
  type ItineraryActionState,
} from "@/lib/actions/member-actions";

const initialState: ItineraryActionState = {};

export function AddSegmentForm({
  itineraryId,
  airports,
  defaultOrigin,
  defaultDestination,
  defaultDate,
}: {
  itineraryId: string;
  airports: Array<{ id: string; code: string; city: string }>;
  defaultOrigin: string;
  defaultDestination: string;
  defaultDate: string;
}) {
  const [state, formAction] = useActionState(addItinerarySegmentAction, initialState);

  return (
    <form action={formAction} className="space-y-3" data-testid="add-segment-form">
      <input type="hidden" name="itineraryId" value={itineraryId} />
      {state.error ? <Alert variant="error">{state.error}</Alert> : null}
      {state.success ? <Alert variant="success">{state.success}</Alert> : null}

      <div className="grid gap-2 sm:grid-cols-3">
        <div>
          <label htmlFor="segment-origin" className="label">
            Dari
          </label>
          <select
            id="segment-origin"
            name="origin"
            className="input"
            defaultValue={defaultOrigin}
          >
            {airports.map((airport) => (
              <option key={airport.id} value={airport.id}>
                {airport.city} ({airport.code})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="segment-destination" className="label">
            Tujuan
          </label>
          <select
            id="segment-destination"
            name="destination"
            className="input"
            defaultValue={defaultDestination}
          >
            {airports.map((airport) => (
              <option key={airport.id} value={airport.id}>
                {airport.city} ({airport.code})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="segment-date" className="label">
            Tanggal
          </label>
          <input
            id="segment-date"
            name="departureDate"
            type="date"
            className="input"
            defaultValue={defaultDate}
            required
          />
        </div>
      </div>

      <SubmitButton variant="secondary">
        <Plus className="size-4" aria-hidden />
        Tambah rute lanjutan
      </SubmitButton>
    </form>
  );
}
