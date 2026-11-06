import type { Metadata } from "next";
import Link from "next/link";
import { Mail, Plane } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { requireRole } from "@/lib/auth/session";
import { getEmailOutbox } from "@/lib/services/travel-service";
import { formatDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Email Outbox" };

export default async function EmailOutboxPage() {
  await requireRole("TRAVEL_MANAGER");
  const emails = await getEmailOutbox();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Simulasi Pengiriman E-Tiket"
        title="Email Outbox"
        description="Kotak keluar simulasi untuk e-tiket yang dikirim ke email pengunjung. Tidak ada SMTP sungguhan pada demo ini."
      />

      {emails.length === 0 ? (
        <EmptyState
          icon={Mail}
          title="Belum ada email"
          description="Email e-tiket akan muncul setelah pemesanan berhasil."
        />
      ) : (
        <div className="space-y-3">
          {emails.map((email) => {
            const first = email.booking?.segments[0]?.flight;
            return (
              <article key={email.id} className="card p-4 sm:p-5" data-testid="email-outbox-item">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-start gap-3">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-sky-soft text-sky">
                      <Mail className="size-4" aria-hidden />
                    </span>
                    <div>
                      <p className="text-sm font-bold">{email.subject}</p>
                      <p className="mt-0.5 text-xs text-muted">
                        Kepada: <span className="font-medium text-ink">{email.recipient}</span> ·{" "}
                        {formatDateTime(email.sentAt)}
                      </p>
                      {first ? (
                        <p className="mt-1 flex items-center gap-1 text-[11px] text-muted">
                          <Plane className="size-3" aria-hidden />
                          {first.origin.code} → {first.destination.code} ·{" "}
                          {email.booking?.referenceCode}
                        </p>
                      ) : null}
                    </div>
                  </div>
                  {email.booking ? (
                    <Link
                      href={`/travel/pemesanan/${email.booking.id}`}
                      className="btn-secondary btn-sm shrink-0"
                    >
                      Lihat pemesanan
                    </Link>
                  ) : null}
                </div>

                <details className="mt-3 rounded-xl border border-line bg-canvas/50 p-3">
                  <summary className="cursor-pointer text-xs font-semibold text-muted">
                    Lihat isi email
                  </summary>
                  <pre className="mt-3 whitespace-pre-wrap font-sans text-xs leading-relaxed text-ink">
                    {email.body}
                  </pre>
                </details>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
