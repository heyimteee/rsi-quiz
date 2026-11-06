"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plane } from "lucide-react";
import { navForRole } from "@/components/nav-config";
import { APP_NAME, ROLE_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";

function isActive(pathname: string, href: string, exact?: boolean) {
  if (pathname === href) return true;
  if (!exact && href !== "/" && pathname.startsWith(`${href}/`)) return true;
  return false;
}

export function Sidebar({ role }: { role: string }) {
  const pathname = usePathname();
  const items = navForRole(role);

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <span className="flex size-10 items-center justify-center rounded-xl bg-navy text-white">
          <Plane className="size-5 -rotate-12" aria-hidden />
        </span>
        <div>
          <p className="text-base font-extrabold tracking-tight text-navy">{APP_NAME}</p>
          <p className="text-[11px] font-medium text-muted">Travel & HR Suite</p>
        </div>
      </div>

      <div className="mx-4 mb-4 rounded-xl bg-canvas px-3 py-2.5">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted">Masuk sebagai</p>
        <p className="mt-0.5 text-sm font-semibold text-ink">{ROLE_LABELS[role] ?? role}</p>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-4" aria-label="Navigasi utama">
        {items.map((item) => {
          const active = isActive(pathname, item.href, item.exact);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                active
                  ? "bg-navy text-white shadow-sm"
                  : "text-muted hover:bg-sky-soft/60 hover:text-navy",
              )}
            >
              <Icon className="size-4.5 shrink-0" aria-hidden />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-line px-5 py-4">
        <p className="text-[11px] leading-relaxed text-muted">
          Tugas RSI · 245150407141002
          <br />
          Tristant AI Harrish Basori
        </p>
      </div>
    </div>
  );
}

export function MobileNav({ role }: { role: string }) {
  const pathname = usePathname();
  const items = navForRole(role);
  return (
    <nav
      className="flex gap-1.5 overflow-x-auto border-b border-line bg-white px-3 py-2 md:hidden"
      aria-label="Navigasi seluler"
    >
      {items.map((item) => {
        const active = isActive(pathname, item.href, item.exact);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold",
              active ? "bg-navy text-white" : "bg-canvas text-muted",
            )}
          >
            <Icon className="size-3.5" aria-hidden />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
