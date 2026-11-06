"use client";

import { useActionState, useState } from "react";
import { BadgeCheck, UserRound } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { SubmitButton } from "@/components/ui/submit-button";
import {
  bookForVisitorAction,
  type VisitorBookingState,
} from "@/lib/actions/travel-actions";
import { formatIDR, maskNik } from "@/lib/utils";

const initialState: VisitorBookingState = {};

export type BookableVisitor = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  nik: string | null;
  complete: boolean;
};

export function VisitorBookingForm({
  flightId,
  price,
  visitors,
}: {
  flightId: string;
  price: number;
  visitors: BookableVisitor[];
}) {
  const [state, formAction] = useActionState(bookForVisitorAction, initialState);
  const [visitorId, setVisitorId] = useState(visitors[0]?.id ?? "");
  const selected = visitors.find((visitor) => visitor.id === visitorId);

  return (
    <form action={formAction} className="space-y-4" data-testid="visitor-booking-form">
      <input type="hidden" name="flightId" value={flightId} />
      {state.error ? <Alert variant="error">{state.error}</Alert> : null}

      <div>
        <h2 className="section-title">Data pengunjung</h2>
        <p className="mt-1 text-sm text-muted">
          Pilih pengunjung yang akan dipesankan tiket. Data identitas diambil dari profil
          pengunjung, bukan dari data manajer.
        </p>
      </div>

      <div>
        <label htmlFor="visitorId" className="label">
          Pengunjung
        </label>
        <select
          id="visitorId"
          name="visitorId"
          className="input"
          value={visitorId}
          onChange={(event) => setVisitorId(event.target.value)}
          required
        >
          {visitors.map((visitor) => (
            <option key={visitor.id} value={visitor.id}>
              {visitor.name} · {visitor.email}
            </option>
          ))}
        </select>
      </div>

      {selected ? (
        <div className="rounded-xl border border-line bg-canvas/60 p-3.5">
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-full bg-sky-soft text-sky">
              <UserRound className="size-4" aria-hidden />
            </span>
            <div>
              <p className="text-sm font-semibold">{selected.name}</p>
              <p className="text-[11px] text-muted">{selected.email}</p>
            </div>
          </div>
          <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <div>
              <dt className="text-muted">NIK</dt>
              <dd className="font-mono">{maskNik(selected.nik)}</dd>
            </div>
            <div>
              <dt className="text-muted">Telepon</dt>
              <dd>{selected.phone ?? "—"}</dd>
            </div>
          </dl>
          <p
            className={`mt-3 flex items-center gap-1.5 text-[11px] font-semibold ${
              selected.complete ? "text-emerald-700" : "text-red-600"
            }`}
          >
            <BadgeCheck className="size-3.5" aria-hidden />
            {selected.complete ? "Data identitas lengkap" : "Data identitas belum lengkap"}
          </p>
        </div>
      ) : null}

      <div className="rounded-xl bg-canvas p-3.5">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted">Total pembayaran</span>
          <span className="text-lg font-extrabold text-navy">{formatIDR(price)}</span>
        </div>
        <p className="mt-1 text-[11px] text-muted">
          E-tiket diterbitkan atas nama pengunjung dan dikirim ke email terdaftar.
        </p>
      </div>

      <SubmitButton
        className="w-full"
        pendingLabel="Menerbitkan tiket pengunjung…"
        disabled={!selected?.complete}
      >
        <BadgeCheck className="size-4" aria-hidden />
        Pesan tiket untuk pengunjung
      </SubmitButton>
    </form>
  );
}
