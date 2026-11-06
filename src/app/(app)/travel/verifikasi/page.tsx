import type { Metadata } from "next";
import Link from "next/link";
import {
  BadgeCheck,
  CalendarDays,
  ClipboardList,
  Clock3,
  FileSearch,
  Mail,
  PlaneTakeoff,
  Ticket,
  UserRound,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Alert } from "@/components/ui/alert";
import { StatusBadge } from "@/components/ui/status-badge";
import { SubmitButton } from "@/components/ui/submit-button";
import { requireRole } from "@/lib/auth/session";
import { getBookingByReference } from "@/lib/services/booking-service";
import { normalizeBookingReference } from "@/lib/domain/booking";
import { MESSAGES } from "@/lib/constants";
import {
  firstParam,
  formatDate,
  formatIDR,
  formatTime,
} from "@/lib/utils";

export const metadata: Metadata = { title: "Verifikasi Kode Booking" };

type SearchParams = Promise<{ kode?: string | string[] }>;

export default async function BookingVerificationPage({ searchParams }: { searchParams: SearchParams }) {
  await requireRole("TRAVEL_MANAGER");
  const params = await searchParams;
  const submitted = params.kode !== undefined;
  const input = (firstParam(params.kode) ?? "").trim();
  const normalized = normalizeBookingReference(input);
  const booking = normalized ? await getBookingByReference(normalized) : null;
  const cancelled = booking?.status === "CANCELLED";
  const outbound =
    booking?.segments.find((segment) => segment.leg === "OUTBOUND") ?? booking?.segments[0];
  const first = outbound?.flight;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Studi Kasus 09 · Manajer Travel"
        title="Verifikasi Kode Booking"
        description="Masukkan kode booking reference untuk melihat status pemesanan tiket. Kode tidak membedakan huruf besar dan kecil."
        actions={
          <Link href="/travel/pemesanan" className="btn-secondary">
            <ClipboardList className="size-4" aria-hidden />
            Daftar pemesanan
          </Link>
        }
      />

      <section className="card p-5" aria-labelledby="form-verifikasi">
        <div className="flex items-center gap-2">
          <FileSearch className="size-5 text-sky" aria-hidden />
          <h2 id="form-verifikasi" className="section-title">
            Otorisasi tiket
          </h2>
        </div>
        <form method="get" className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label htmlFor="kode" className="label">
              Kode booking reference
            </label>
            <input
              id="kode"
              name="kode"
              className="input font-mono uppercase tracking-wider"
              placeholder="TRV-XXXXXX"
              defaultValue={input}
              required
              autoFocus
            />
            <p className="helper">Contoh kode dari data demo: TRV-DEMO01</p>
          </div>
          <SubmitButton>
            <Ticket className="size-4" aria-hidden />
            Periksa status
          </SubmitButton>
        </form>
      </section>

      {submitted && !booking ? (
        <Alert variant="error" title={MESSAGES.BOOKING_REFERENCE_INVALID}>
          Kode <strong>{normalized}</strong> tidak cocok dengan pemesanan mana pun. Periksa kembali
          kode booking reference dan coba lagi.
        </Alert>
      ) : null}

      {booking ? (
        <section className="card overflow-hidden" data-testid="reference-result">
          <div
            className={`flex flex-col gap-3 border-b border-line p-5 sm:flex-row sm:items-center sm:justify-between ${
              cancelled ? "bg-amber-soft/60" : "bg-green-soft/50"
            }`}
          >
            <div className="flex items-center gap-3">
              <span
                className={`flex size-10 items-center justify-center rounded-xl ${
                  cancelled ? "bg-amber-soft text-amber-700" : "bg-green-soft text-emerald-700"
                }`}
              >
                <BadgeCheck className="size-5" aria-hidden />
              </span>
              <div>
                <p
                  className={`text-xs font-semibold uppercase tracking-wide ${
                    cancelled ? "text-amber-800" : "text-emerald-800"
                  }`}
                >
                  {cancelled ? "Kode ditemukan · pemesanan dibatalkan" : "Kode booking ditemukan"}
                </p>
                <p className="font-mono text-lg font-extrabold tracking-wider text-navy">
                  {booking.referenceCode}
                </p>
              </div>
            </div>
            <StatusBadge status={booking.status} className="text-xs" />
          </div>

          <div className="grid gap-5 p-5 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted">
                <UserRound className="size-3.5" aria-hidden />
                Penumpang
              </p>
              <p className="mt-1 font-semibold">{booking.passenger.name}</p>
              <p className="mt-0.5 flex items-center gap-1 text-xs text-muted">
                <Mail className="size-3" aria-hidden />
                {booking.passenger.email}
              </p>
            </div>
            <div>
              <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted">
                <PlaneTakeoff className="size-3.5" aria-hidden />
                Rute
              </p>
              <p className="mt-1 font-semibold">
                {first?.origin.code} → {first?.destination.code}
              </p>
              <p className="mt-0.5 text-xs text-muted">
                {booking.tripType === "ROUND_TRIP" ? "Pulang-pergi" : "Sekali jalan"}
              </p>
            </div>
            <div>
              <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted">
                <CalendarDays className="size-3.5" aria-hidden />
                Jadwal
              </p>
              <p className="mt-1 font-semibold">{first ? formatDate(first.departureAt) : "—"}</p>
              <p className="mt-0.5 flex items-center gap-1 text-xs text-muted">
                <Clock3 className="size-3" aria-hidden />
                {first ? formatTime(first.departureAt) : "—"}
              </p>
            </div>
            <div>
              <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted">
                <Ticket className="size-3.5" aria-hidden />
                Total
              </p>
              <p className="mt-1 font-semibold">{formatIDR(booking.totalPrice)}</p>
              <p className="mt-0.5 text-xs text-muted">Tiket {booking.ticket?.ticketNumber}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 border-t border-line bg-canvas/50 px-5 py-3">
            <Link href={`/travel/pemesanan/${booking.id}`} className="btn-secondary btn-sm">
              Lihat detail pemesanan
            </Link>
            <Link href="/dev/email" className="btn-ghost btn-sm">
              Lihat email e-tiket
            </Link>
          </div>
        </section>
      ) : null}

      {!submitted ? (
        <p className="text-xs leading-relaxed text-muted">
          Status yang ditampilkan adalah status terbaru pemesanan. Jika kode tidak sesuai, sistem
          akan menampilkan pesan “{MESSAGES.BOOKING_REFERENCE_INVALID}” dan meminta Anda
          memasukkan ulang kode.
        </p>
      ) : null}
    </div>
  );
}
