import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  BadgeCheck,
  BriefcaseBusiness,
  CalendarDays,
  ChevronRight,
  Compass,
  Plane,
  ShieldCheck,
  Ticket,
  UserRound,
} from "lucide-react";
import { getSession, homeForRole } from "@/lib/auth/session";
import { APP_NAME } from "@/lib/constants";
import { LoginForm } from "./login-form";
import { quickLoginAction } from "./actions";

export const metadata: Metadata = { title: "Masuk" };

const demoAccounts = [
  {
    email: "hrd@demo.test",
    role: "Manajer HRD",
    description: "Daftar, detail, dan riwayat cuti pegawai",
    icon: CalendarDays,
    tone: "bg-sky-soft text-sky",
  },
  {
    email: "penumpang@demo.test",
    role: "Calon Penumpang",
    description: "Cari, pesan, dan batalkan tiket",
    icon: Plane,
    tone: "bg-green-soft text-emerald-700",
  },
  {
    email: "member@demo.test",
    role: "Member (profil lengkap)",
    description: "Multi-destinasi, validasi tiket, pembayaran",
    icon: BadgeCheck,
    tone: "bg-amber-soft text-amber-700",
  },
  {
    email: "member2@demo.test",
    role: "Member (profil belum lengkap)",
    description: "Menguji penolakan validasi tiket",
    icon: UserRound,
    tone: "bg-red-soft text-red-600",
  },
  {
    email: "travel@demo.test",
    role: "Manajer Travel",
    description: "Status booking, pesan untuk pengunjung",
    icon: BriefcaseBusiness,
    tone: "bg-indigo-50 text-indigo-600",
  },
  {
    email: "pengunjung@demo.test",
    role: "Pengunjung",
    description: "Melihat tiket yang dipesankan manajer",
    icon: Compass,
    tone: "bg-cyan-50 text-cyan-700",
  },
  {
    email: "pelanggan@demo.test",
    role: "Pelanggan",
    description: "Riwayat pemesanan dan pembatalan",
    icon: Ticket,
    tone: "bg-violet-50 text-violet-700",
  },
  {
    email: "budi.visitor@demo.test",
    role: "Pengunjung (Budi)",
    description: "Tiket pesanan manajer travel",
    icon: Compass,
    tone: "bg-teal-50 text-teal-700",
  },
];

export default async function LoginPage() {
  const session = await getSession();
  if (session) redirect(homeForRole(session.role));

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[1.05fr_1fr]">
      <section className="relative hidden overflow-hidden bg-navy p-10 text-white lg:flex lg:flex-col lg:justify-between">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, #67e8f9 0, transparent 35%), radial-gradient(circle at 80% 70%, #38bdf8 0, transparent 32%), radial-gradient(circle at 50% 100%, #fbbf24 0, transparent 28%)",
          }}
          aria-hidden
        />
        <div className="relative">
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-white/10 backdrop-blur">
              <Plane className="size-6 -rotate-12" aria-hidden />
            </span>
            <div>
              <p className="text-xl font-extrabold tracking-tight">{APP_NAME}</p>
              <p className="text-xs text-white/60">Travel & HR Suite</p>
            </div>
          </div>

          <h1 className="mt-16 max-w-xl text-4xl font-extrabold leading-[1.15] tracking-tight text-balance xl:text-5xl">
            Satu sistem untuk perjalanan, tiket, dan cuti pegawai.
          </h1>
          <p className="mt-5 max-w-lg text-sm leading-relaxed text-white/70">
            Implementasi 10 studi kasus RSI: pemesanan tiket pesawat, perbandingan harga,
            multi-destinasi, validasi identitas, hingga manajemen cuti HRD.
          </p>

          <div className="mt-10 grid max-w-lg grid-cols-2 gap-3 text-sm">
            {[
              "Pencarian & pemesanan tiket",
              "Perbandingan harga maskapai",
              "Validasi tiket berbasis profil",
              "Manajemen cuti pegawai",
            ].map((feature) => (
              <div
                key={feature}
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-xs text-white/80 backdrop-blur"
              >
                <ShieldCheck className="size-4 shrink-0 text-cyan-300" aria-hidden />
                {feature}
              </div>
            ))}
          </div>
        </div>

        <div className="relative mt-10 flex items-center gap-2 text-[11px] text-white/50">
          <span className="size-2 rounded-full bg-emerald-400" aria-hidden />
          Data demo siap pakai · Tidak memerlukan pendaftaran
        </div>
      </section>

      <main
        id="main-content"
        className="flex min-h-screen items-center justify-center bg-canvas px-4 py-10 sm:px-8"
      >
        <div className="w-full min-w-0 max-w-md">
          <h1 className="sr-only">Masuk ke TravelKu</h1>
          <div className="mb-6 flex items-center gap-2.5 lg:hidden">
            <span className="flex size-10 items-center justify-center rounded-xl bg-navy text-white">
              <Plane className="size-5 -rotate-12" aria-hidden />
            </span>
            <div>
              <p className="text-lg font-extrabold tracking-tight text-navy">{APP_NAME}</p>
              <p className="text-[11px] text-muted">Travel & HR Suite</p>
            </div>
          </div>

          <div className="card p-6 sm:p-7">
            <p className="eyebrow">Selamat datang kembali</p>
            <h2 className="mt-1 text-2xl font-extrabold tracking-tight">Masuk ke akun Anda</h2>
            <p className="mt-1.5 text-sm text-muted">
              Gunakan akun demo di bawah atau masukkan email dan kata sandi.
            </p>

            <div className="mt-6">
              <LoginForm />
            </div>
          </div>

          {process.env.DEMO_MODE === "true" ? (
            <div className="mt-6">
              <div className="mb-3 flex items-center justify-between gap-2">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted">Akun demo</p>
                <span className="text-[11px] text-muted">Klik untuk masuk langsung</span>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {demoAccounts.map((account) => {
                  const Icon = account.icon;
                  return (
                    <form key={account.email} action={quickLoginAction} className="min-w-0">
                      <input type="hidden" name="email" value={account.email} />
                      <button
                        type="submit"
                        className="group flex w-full min-w-0 items-center gap-3 rounded-xl border border-line bg-white px-3.5 py-3 text-left transition hover:border-sky/40 hover:bg-sky-soft/30"
                      >
                        <span
                          className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${account.tone}`}
                        >
                          <Icon className="size-4" aria-hidden />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-semibold text-ink">{account.role}</span>
                          <span className="block truncate text-[11px] text-muted">
                            {account.email} · {account.description}
                          </span>
                        </span>
                        <ChevronRight
                          className="size-4 shrink-0 text-muted transition group-hover:translate-x-0.5"
                          aria-hidden
                        />
                      </button>
                    </form>
                  );
                })}
              </div>
              <p className="mt-4 text-center text-[11px] text-muted">
                Kata sandi semua akun demo:{" "}
                <span className="font-semibold text-ink">password123</span>
              </p>
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
}
