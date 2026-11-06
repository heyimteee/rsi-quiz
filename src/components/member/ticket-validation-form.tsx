"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { BadgeCheck } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { SubmitButton } from "@/components/ui/submit-button";
import {
  validateTicketAction,
  type ValidationActionState,
} from "@/lib/actions/member-actions";

const initialState: ValidationActionState = {};

export type ValidatableTicket = {
  id: string;
  referenceCode: string;
  route: string;
  departureDate: string;
  validationStatus: string;
};

export function TicketValidationForm({
  tickets,
  profileIncomplete,
}: {
  tickets: ValidatableTicket[];
  profileIncomplete: boolean;
}) {
  const [state, formAction] = useActionState(validateTicketAction, initialState);
  const [bookingId, setBookingId] = useState(tickets[0]?.id ?? "");
  const selectedTicket = tickets.find((ticket) => ticket.id === bookingId) ?? null;
  const showResult =
    Boolean(state.status) && (!state.reference || state.reference === selectedTicket?.referenceCode);

  return (
    <form action={formAction} className="space-y-4" data-testid="validation-form">
      {profileIncomplete ? (
        <Alert variant="warning" title="Data profil belum lengkap">
          Sistem akan menolak validasi tiket dengan pesan “Data profil tidak lengkap” sampai
          seluruh data wajib terisi.{" "}
          <Link href="/member/profil" className="font-semibold underline">
            Lengkapi profil
          </Link>
        </Alert>
      ) : null}

      {state.error ? <Alert variant="error">{state.error}</Alert> : null}
      {showResult && state.status === "VALID" ? (
        <Alert variant="success" title={state.alreadyValid ? "Tiket sudah tervalidasi" : "Validasi berhasil"}>
          {state.message}
          {state.reference ? (
            <>
              {" "}
              Kode booking <strong>{state.reference}</strong> dinyatakan valid.
            </>
          ) : null}
        </Alert>
      ) : null}
      {showResult && state.status === "REJECTED" ? (
        <Alert variant="error" title={state.message ?? "Data profil tidak lengkap"}>
          <p>Validasi tiket ditolak. Lengkapi data berikut terlebih dahulu:</p>
          <ul className="mt-1 list-inside list-disc">
            {(state.missingLabels ?? []).map((label) => (
              <li key={label}>{label}</li>
            ))}
          </ul>
          <Link href="/member/profil" className="mt-2 inline-block font-semibold underline">
            Buka halaman profil
          </Link>
        </Alert>
      ) : null}

      <div>
        <label htmlFor="bookingId" className="label">
          Pilih tiket
        </label>
        <select
          id="bookingId"
          name="bookingId"
          className="input"
          value={bookingId}
          onChange={(event) => setBookingId(event.target.value)}
          required
        >
          {tickets.map((ticket) => (
            <option key={ticket.id} value={ticket.id}>
              {ticket.referenceCode} · {ticket.route} · {ticket.departureDate} ·{" "}
              {ticket.validationStatus === "VALID"
                ? "Tervalidasi"
                : ticket.validationStatus === "REJECTED"
                  ? "Ditolak"
                  : "Belum divalidasi"}
            </option>
          ))}
        </select>
      </div>

      <SubmitButton pendingLabel="Memvalidasi tiket…">
        <BadgeCheck className="size-4" aria-hidden />
        Validasi tiket
      </SubmitButton>
    </form>
  );
}
