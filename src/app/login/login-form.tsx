"use client";

import { useActionState, useState } from "react";
import { LockKeyhole, Mail } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { SubmitButton } from "@/components/ui/submit-button";
import { loginAction, type LoginState } from "./actions";

const initialState: LoginState = {};

export function LoginForm() {
  const [state, formAction] = useActionState(loginAction, initialState);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <form action={formAction} className="space-y-4" noValidate={false}>
      {state.error ? <Alert variant="error">{state.error}</Alert> : null}

      <div>
        <label htmlFor="email" className="label">
          Email
        </label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="nama@demo.test"
            className="input pl-10"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>
      </div>

      <div>
        <label htmlFor="password" className="label">
          Kata sandi
        </label>
        <div className="relative">
          <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            placeholder="••••••••"
            className="input pl-10"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>
      </div>

      <SubmitButton className="w-full" pendingLabel="Memeriksa akun…">
        Masuk ke sistem
      </SubmitButton>
    </form>
  );
}
