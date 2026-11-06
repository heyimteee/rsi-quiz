import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck, History, Ticket, UserRound } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import {
  TicketValidationForm,
  type ValidatableTicket,
} from "@/components/member/ticket-validation-form";
import { requireRole } from "@/lib/auth/session";
import {
  getMemberTickets,
  getValidationHistory,
} from "@/lib/services/member-service";
import { getPassengerProfile } from "@/lib/services/booking-service";
import { checkProfileCompleteness } from "@/lib/domain/profile";
import { formatDate, formatDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Validasi Tiket" };

export default async function TicketValidationPage() {
  const user = await requireRole("MEMBER");
  const [tickets, profile, history] = await Promise.all([
    getMemberTickets(user.id),
    getPassengerProfile(user.id),
    getValidationHistory(user.id),
  ]);
  const completeness = checkProfileCompleteness(profile);

  const validatable: ValidatableTicket[] = tickets
    .filter((booking) => booking.ticket)
    .map((booking) => {
      const outbound =
        booking.segments.find((segment) => segment.leg === "OUTBOUND") ?? booking.segments[0];
      const flight = outbound?.flight;
      return {
        id: booking.id,
        referenceCode: booking.referenceCode,
        route: `${flight?.origin.code ?? "—"} → ${flight?.destination.code ?? "—"}${
          booking.tripType === "ROUND_TRIP" ? " (pulang-pergi)" : ""
        }`,
        departureDate: flight ? formatDate(flight.departureAt) : "—",
        validationStatus: booking.ticket?.validationStatus ?? "PENDING",
      };
    });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Studi Kasus 05 · Member Frequent Traveller"
        title="Validasi Tiket"
        description="Validasi tiket menggunakan data identitas yang tersimpan pada profil. Validasi hanya berhasil jika seluruh data wajib sudah lengkap."
        actions={
          <Link href="/member/profil" className="btn-secondary">
            <UserRound className="size-4" aria-hidden />
            Perbarui profil
          </Link>
        }
      />

      {!completeness.complete ? (
        <Alert variant="warning" title="Data profil belum lengkap">
          Tiket belum dapat divalidasi. Lengkapi {completeness.missingLabels.join(", ")} pada
          halaman profil. Pesan yang akan ditampilkan sistem:{" "}
          <strong>“Data profil tidak lengkap”</strong>.
        </Alert>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <section className="card p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <BadgeCheck className="size-5 text-sky" aria-hidden />
            <h2 className="section-title">Validasi tiket</h2>
          </div>
          <p className="mt-1 text-sm text-muted">
            Pilih salah satu tiket aktif Anda, lalu jalankan validasi identitas.
          </p>
          <div className="mt-5">
            {validatable.length === 0 ? (
              <EmptyState
                icon={Ticket}
                title="Belum ada tiket"
                description="Tiket yang dapat divalidasi akan muncul setelah Anda melakukan pemesanan."
                action={
                  <Link href="/member/penerbangan" className="btn-primary">
                    Cari penerbangan
                  </Link>
                }
              />
            ) : (
              <TicketValidationForm
                tickets={validatable}
                profileIncomplete={!completeness.complete}
              />
            )}
          </div>
        </section>

        <div className="space-y-4">
          <section className="card p-5" aria-labelledby="status-profil">
            <h2 id="status-profil" className="section-title">
              Status profil
            </h2>
            <div
              className={`mt-3 rounded-xl px-3 py-2 text-sm font-semibold ${
                completeness.complete
                  ? "bg-green-soft text-emerald-800"
                  : "bg-red-soft text-red-700"
              }`}
            >
              {completeness.complete ? "Profil lengkap" : "Data profil tidak lengkap"}
            </div>
            {!completeness.complete ? (
              <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-muted">
                {completeness.missingLabels.map((label) => (
                  <li key={label}>{label}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-xs text-muted">
                Seluruh data wajib tersedia. Validasi tiket dapat dilakukan.
              </p>
            )}
            <Link href="/member/profil" className="btn-secondary mt-3 w-full">
              Kelola profil
            </Link>
          </section>

          <section className="card p-5" aria-labelledby="riwayat-validasi">
            <div className="flex items-center gap-2">
              <History className="size-5 text-sky" aria-hidden />
              <h2 id="riwayat-validasi" className="section-title">
                Riwayat validasi
              </h2>
            </div>
            {history.length === 0 ? (
              <p className="mt-2 text-xs text-muted">Belum ada riwayat validasi tiket.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {history.map((item) => (
                  <li key={item.id} className="rounded-xl border border-line p-3 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono font-semibold">
                        {item.ticket.booking.referenceCode}
                      </span>
                      <span
                        className={`badge ${
                          item.status === "VALID"
                            ? "bg-green-soft text-emerald-800"
                            : "bg-red-soft text-red-700"
                        }`}
                      >
                        {item.status === "VALID" ? "Valid" : "Ditolak"}
                      </span>
                    </div>
                    <p className="mt-1 text-muted">{item.message}</p>
                    <p className="mt-1 text-[10px] text-muted">{formatDateTime(item.createdAt)}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
