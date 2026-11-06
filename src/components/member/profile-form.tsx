"use client";

import { useActionState, useState } from "react";
import { Save } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { SubmitButton } from "@/components/ui/submit-button";
import {
  updateProfileAction,
  type ProfileActionState,
} from "@/lib/actions/member-actions";

const initialState: ProfileActionState = {};

export function ProfileForm({
  defaults,
  email,
}: {
  defaults: {
    fullName: string;
    nik: string;
    phone: string;
    birthDate: string;
    passportNumber: string;
  };
  email: string;
}) {
  const [state, formAction] = useActionState(updateProfileAction, initialState);
  const [values, setValues] = useState(defaults);

  function update(key: keyof typeof defaults, value: string) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  return (
    <form action={formAction} className="space-y-4" data-testid="profile-form">
      {state.error ? <Alert variant="error">{state.error}</Alert> : null}
      {state.success ? <Alert variant="success">{state.success}</Alert> : null}

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

      <div className="grid gap-4 sm:grid-cols-2">
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
            required
            value={values.nik}
            onChange={(event) => update("nik", event.target.value.replace(/\D/g, ""))}
          />
          {state.fieldErrors?.nik ? (
            <p className="mt-1 text-xs font-medium text-red-600">{state.fieldErrors.nik}</p>
          ) : null}
        </div>
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
        <div>
          <label htmlFor="passportNumber" className="label">
            Nomor paspor <span className="normal-case tracking-normal">(opsional)</span>
          </label>
          <input
            id="passportNumber"
            name="passportNumber"
            className="input"
            maxLength={20}
            value={values.passportNumber}
            onChange={(event) => update("passportNumber", event.target.value)}
          />
          {state.fieldErrors?.passportNumber ? (
            <p className="mt-1 text-xs font-medium text-red-600">
              {state.fieldErrors.passportNumber}
            </p>
          ) : null}
        </div>
      </div>

      <div>
        <label htmlFor="email" className="label">
          Email akun
        </label>
        <input id="email" className="input bg-canvas" value={email} readOnly disabled />
        <p className="helper">Email akun tidak dapat diubah pada halaman profil.</p>
      </div>

      <SubmitButton>
        <Save className="size-4" aria-hidden />
        Simpan profil
      </SubmitButton>
    </form>
  );
}
