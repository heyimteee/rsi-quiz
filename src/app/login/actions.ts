"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { createSession, destroySession, homeForRole } from "@/lib/auth/session";
import { MESSAGES } from "@/lib/constants";

export type LoginState = {
  error?: string;
};

export async function loginAction(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Email dan kata sandi wajib diisi" };
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return { error: MESSAGES.LOGIN_INVALID };
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return { error: MESSAGES.LOGIN_INVALID };
  }

  await createSession({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  });

  redirect(homeForRole(user.role));
}

export async function quickLoginAction(formData: FormData) {
  if (process.env.DEMO_MODE !== "true") redirect("/login");
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email.endsWith("@demo.test")) redirect("/login");

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) redirect("/login");

  await createSession({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  });

  redirect(homeForRole(user.role));
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}
