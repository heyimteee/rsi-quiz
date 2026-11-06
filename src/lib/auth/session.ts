import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";
import { cache } from "react";
import { ROLES, type Role } from "@/lib/constants";

const COOKIE_NAME = "rsi_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7;

function getSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("SESSION_SECRET wajib diisi minimal 32 karakter pada mode produksi.");
    }
    return new TextEncoder().encode("rsi-quiz-local-dev-secret-not-for-production");
  }
  return new TextEncoder().encode(secret);
}

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: Role | string;
};

export async function createSession(user: SessionUser) {
  const token = await new SignJWT({
    name: user.name,
    email: user.email,
    role: user.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(getSecret());

  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_DURATION_SECONDS,
    path: "/",
  });
}

export async function destroySession() {
  const store = await cookies();
  store.set(COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
    path: "/",
  });
}

export const getSession = cache(async (): Promise<SessionUser | null> => {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret(), { algorithms: ["HS256"] });
    if (!payload.sub || typeof payload.role !== "string") return null;
    return {
      id: payload.sub,
      name: typeof payload.name === "string" ? payload.name : "",
      email: typeof payload.email === "string" ? payload.email : "",
      role: payload.role,
    };
  } catch {
    return null;
  }
});

export const ROLE_HOME: Record<string, string> = {
  [ROLES.HRD_MANAGER]: "/hrd/cuti",
  [ROLES.PASSENGER]: "/penerbangan",
  [ROLES.MEMBER]: "/member/penerbangan",
  [ROLES.TRAVEL_MANAGER]: "/travel/pemesanan",
  [ROLES.VISITOR]: "/tiket-saya",
};

export function homeForRole(role: string | undefined | null) {
  if (!role) return "/login";
  return ROLE_HOME[role] ?? "/login";
}

export async function requireUser(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

export async function requireRole(roles: string | string[]): Promise<SessionUser> {
  const session = await requireUser();
  const allowed = Array.isArray(roles) ? roles : [roles];
  if (!allowed.includes(session.role)) redirect("/unauthorized");
  return session;
}
