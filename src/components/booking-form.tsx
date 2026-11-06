"use client";

import { useActionState, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { SubmitButton } from "@/components/ui/submit-button";
import {
  bookFlightAction,
  bookRoundTripAction,
  type BookingActionState,
} from "@/lib/actions/booking-actions";
import { formatIDR } from "@/lib/utils";

export type BookingDefaults = {
  fullName: string;
  nik: string;
  phone: string;
  birthDate: string;
};

const initialState: BookingActionState = {};

export function BookingForm({
  mode,
  flightId,
  outboundId,
  returnId,
  price,
  defaults,
  title = "Data penumpang",
  submitLabel = "Konfirmasi pemesanan",
}: {
  mode: "one-way" | "round-trip";
  flightId?: string;
  outboundId?: string;
  returnId?: string;
  price: number;
  defaults: BookingDefaults;
  title?: string;
  submitLabel?: string;
}) {
  const action = mode === "round-trip" ? bookRoundTripAction : bookFlightAction;
  const [state, formAction] = useActionState(action, initialState);
  const [values, setValues] = useState(defaults);

  function update(key: keyof BookingDefaults, value: string) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  return (
    <form action={formAction} className="space-y-4" data-testid="booking-form">
      {flightId ? <input type="hidden" name="flightId" value={flightId} /> : null}
      {outboundId ? <input type="hidden" name="outboundId" value={outboundId} /> : null}
      {returnId ? <input type="hidden" name="returnId" value={returnId} /> : null}

      {state.error ? <Alert variant="error">{state.error}</Alert> : null}

      <div>
        <h2 className="section-title">{title}</h2>
        <p className="mt-1 text-sm text-muted">
          Data identitas digunakan untuk penerbitan tiket dan akan disimpan ke profil Anda.
        </p>
      </div>

      <div className="space-y-3">
        <div>
          <label htmlFor="fullName" className="label">
            Nama lengkap
          </label>
          <input
            id="fullName"
            name="fullName"
            className="input"
            autoComplete="name"
            required
            value={values.fullName}
            onChange={(event) => update("fullName", event.target.value)}
          />
          {state.fieldErrors?.fullName ? (
            <p className="mt-1 text-xs font-medium text-red-600">{state.fieldErrors.fullName}</p>
          ) : null}
        </div>

        <div>
          <label htmlFor="nik" className="label">
            NIK
          </label>
          <input
            id="nik"
            name="nik"
            className="input"
            inputMode="numeric"
            maxLength={16}
            placeholder="16 digit NIK"
            required
            value={values.nik}
            onChange={(event) => update("nik", event.target.value.replace(/\D/g, ""))}
          />
          {state.fieldErrors?.nik ? (
            <p className="mt-1 text-xs font-medium text-red-600">{state.fieldErrors.nik}</p>
          ) : null}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="phone" className="label">
              Nomor telepon
            </label>
            <input
              id="phone"
              name="phone"
              className="input"
              type="tel"
              autoComplete="tel"
              placeholder="08xxxxxxxxxx"
              required
              value={values.phone}
              onChange={(event) => update("phone", event.target.value)}
            />
            {state.fieldErrors?.phone ? (
              <p className="mt-1 text-xs font-medium text-red-600">{state.fieldErrors.phone}</p>
            ) : null}
          </div>
          <div>
            <label htmlFor="birthDate" className="label">
              Tanggal lahir
            </label>
            <input
              id="birthDate"
              name="birthDate"
              className="input"
              type="date"
              required
              value={values.birthDate}
              onChange={(event) => update("birthDate", event.target.value)}
            />
            {state.fieldErrors?.birthDate ? (
              <p className="mt-1 text-xs font-medium text-red-600">{state.fieldErrors.birthDate}</p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="rounded-xl bg-canvas p-3.5">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted">Total pembayaran</span>
          <span className="text-lg font-extrabold text-navy">{formatIDR(price)}</span>
        </div>
        <p className="mt-1 text-[11px] text-muted">Harga sudah termasuk pajak dan biaya layanan.</p>
      </div>

      <SubmitButton className="w-full" pendingLabel="Menerbitkan tiket…">
        <ShieldCheck className="size-4" aria-hidden />
        {submitLabel}
      </SubmitButton>
      <p className="text-center text-[11px] leading-relaxed text-muted">
        Dengan melanjutkan, Anda menyetujui ketentuan pemesanan dan kebijakan pembatalan TravelKu.
      </p>
    </form>
  );
}
