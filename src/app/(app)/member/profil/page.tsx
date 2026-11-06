import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck, CheckCircle2, Circle, ShieldCheck, UserRound } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { ProfileForm } from "@/components/member/profile-form";
import { requireRole } from "@/lib/auth/session";
import { getPassengerProfile } from "@/lib/services/booking-service";
import { checkProfileCompleteness } from "@/lib/domain/profile";
import { formatDate, toDateInputValue } from "@/lib/utils";

export const metadata: Metadata = { title: "Profil Member" };

export default async function MemberProfilePage() {
  const user = await requireRole("MEMBER");
  const profile = await getPassengerProfile(user.id);
  const completeness = checkProfileCompleteness(profile);

  const fields = [
    { label: "Nama lengkap", value: profile?.fullName, icon: UserRound },
    { label: "NIK", value: profile?.nik, icon: ShieldCheck },
    { label: "Nomor telepon", value: profile?.phone, icon: BadgeCheck },
    {
      label: "Tanggal lahir",
      value: profile?.birthDate ? formatDate(profile.birthDate) : null,
      icon: ShieldCheck,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Studi Kasus 05 · Member Frequent Traveller"
        title="Profil Member"
        description="Perbarui data identitas yang digunakan untuk penerbitan dan validasi tiket. Data wajib harus lengkap sebelum tiket dapat divalidasi."
        actions={
          <Link href="/member/validasi" className="btn-secondary">
            <BadgeCheck className="size-4" aria-hidden />
            Validasi tiket
          </Link>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <section className="card p-5 sm:p-6">
          <h2 className="section-title">Data identitas</h2>
          <p className="mt-1 text-sm text-muted">
            Nama, NIK, nomor telepon, dan tanggal lahir wajib diisi. Nomor paspor opsional untuk
            penerbangan domestik.
          </p>
          <div className="mt-5">
            <ProfileForm
              email={user.email}
              defaults={{
                fullName: profile?.fullName ?? user.name,
                nik: profile?.nik ?? "",
                phone: profile?.phone ?? "",
                birthDate: toDateInputValue(profile?.birthDate),
                passportNumber: profile?.passportNumber ?? "",
              }}
            />
          </div>
        </section>

        <div className="space-y-4">
          <section className="card p-5" aria-labelledby="kelengkapan">
            <h2 id="kelengkapan" className="section-title">
              Kelengkapan data wajib
            </h2>
            <div
              className={`mt-3 rounded-xl px-3 py-2 text-sm font-semibold ${
                completeness.complete
                  ? "bg-green-soft text-emerald-800"
                  : "bg-amber-soft text-amber-900"
              }`}
            >
              {completeness.complete
                ? "Semua data wajib sudah lengkap"
                : `${completeness.missingLabels.length} data wajib belum lengkap`}
            </div>
            <ul className="mt-3 space-y-2">
              {fields.map((field) => {
                const filled = Boolean(field.value && String(field.value).trim());
                return (
                  <li key={field.label} className="flex items-start gap-2 text-sm">
                    {filled ? (
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" aria-hidden />
                    ) : (
                      <Circle className="mt-0.5 size-4 shrink-0 text-muted" aria-hidden />
                    )}
                    <div>
                      <p className={filled ? "font-medium" : "font-medium text-muted"}>
                        {field.label}
                      </p>
                      <p className="text-xs text-muted">{field.value || "Belum diisi"}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="card p-5" aria-labelledby="info-validasi">
            <h2 id="info-validasi" className="section-title">
              Tentang validasi tiket
            </h2>
            <p className="mt-2 text-xs leading-relaxed text-muted">
              Validasi tiket memerlukan data identitas yang lengkap. Jika data belum lengkap,
              sistem menolak validasi dengan pesan{" "}
              <strong className="text-ink">“Data profil tidak lengkap”</strong> hingga profil
              diperbarui.
            </p>
            <Link href="/member/validasi" className="btn-secondary mt-3 w-full">
              Buka validasi tiket
            </Link>
          </section>
        </div>
      </div>
    </div>
  );
}
