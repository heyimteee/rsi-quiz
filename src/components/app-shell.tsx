import Link from "next/link";
import { LogOut, Plane } from "lucide-react";
import { logoutAction } from "@/app/login/actions";
import { MobileNav, Sidebar } from "@/components/sidebar";
import type { SessionUser } from "@/lib/auth/session";
import { APP_NAME, ROLE_LABELS } from "@/lib/constants";
import { initials } from "@/lib/utils";

export function AppShell({ user, children }: { user: SessionUser; children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-line md:block">
        <Sidebar role={user.role} />
      </aside>

      <div className="md:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-line bg-white/90 px-4 backdrop-blur sm:px-6">
          <Link href="/" className="flex items-center gap-2 md:hidden">
            <span className="flex size-8 items-center justify-center rounded-lg bg-navy text-white">
              <Plane className="size-4 -rotate-12" aria-hidden />
            </span>
            <span className="font-extrabold tracking-tight text-navy">{APP_NAME}</span>
          </Link>

          <div className="hidden md:block">
            <p className="text-xs font-medium text-muted">Sistem Informasi Perjalanan & Manajemen Cuti</p>
          </div>

          <div className="ml-auto flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-semibold leading-tight">{user.name}</p>
              <p className="text-[11px] text-muted">{ROLE_LABELS[user.role] ?? user.role}</p>
            </div>
            <span
              className="flex size-9 items-center justify-center rounded-full bg-sky-soft text-xs font-bold text-sky"
              aria-hidden
            >
              {initials(user.name)}
            </span>
            <form action={logoutAction}>
              <button
                type="submit"
                className="btn-ghost btn-sm"
                title="Keluar"
                aria-label="Keluar dari akun"
              >
                <LogOut className="size-4" aria-hidden />
                <span className="hidden sm:inline">Keluar</span>
              </button>
            </form>
          </div>
        </header>

        <MobileNav role={user.role} />

        <main id="main-content" className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
