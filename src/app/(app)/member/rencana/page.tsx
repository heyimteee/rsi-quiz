import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CalendarDays, MapPin, Plus, Route } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { requireRole } from "@/lib/auth/session";
import { getItineraries } from "@/lib/services/itinerary-service";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Rencana Perjalanan" };

export default async function ItineraryListPage() {
  const user = await requireRole("MEMBER");
  const itineraries = await getItineraries(user.id);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Studi Kasus 04 · Member Frequent Traveller"
        title="Rencana Perjalanan"
        description="Susun rute perjalanan multi-destinasi dengan menambahkan rute lanjutan, lalu gunakan rencana ini untuk mencari penerbangan."
        actions={
          <Link href="/member/rencana/baru" className="btn-primary">
            <Plus className="size-4" aria-hidden />
            Buat rencana baru
          </Link>
        }
      />

      {itineraries.length === 0 ? (
        <EmptyState
          icon={Route}
          title="Belum ada rencana perjalanan"
          description="Buat rencana pertama Anda dengan menambahkan dua atau lebih rute perjalanan."
          action={
            <Link href="/member/rencana/baru" className="btn-primary">
              Buat rencana perjalanan
            </Link>
          }
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {itineraries.map((itinerary) => (
            <article key={itinerary.id} className="card p-5" data-testid="itinerary-card">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="eyebrow">Rencana perjalanan</p>
                  <h2 className="mt-1 text-lg font-bold">{itinerary.name}</h2>
                  <p className="mt-0.5 text-xs text-muted">
                    Dibuat {formatDate(itinerary.createdAt)} · {itinerary.segments.length} rute
                  </p>
                </div>
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-sky-soft text-sky">
                  <Route className="size-4" aria-hidden />
                </span>
              </div>

              <ol className="mt-4 space-y-2">
                {itinerary.segments.map((segment, index) => (
                  <li key={segment.id} className="flex items-start gap-2 text-sm">
                    <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-canvas text-[10px] font-bold text-muted">
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-semibold">
                        {segment.origin.city} ({segment.origin.code}) →{" "}
                        {segment.destination.city} ({segment.destination.code})
                      </p>
                      <p className="flex items-center gap-1 text-xs text-muted">
                        <CalendarDays className="size-3" aria-hidden />
                        {formatDate(segment.departureDate)}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>

              <div className="mt-4 flex flex-wrap gap-2 border-t border-line/70 pt-3">
                <Link href={`/member/rencana/${itinerary.id}`} className="btn-secondary btn-sm">
                  Buka rencana
                </Link>
                <Link
                  href={`/member/pencarian-multi?itineraryId=${itinerary.id}&cari=1`}
                  className="btn-primary btn-sm"
                >
                  Cari penerbangan
                  <ArrowRight className="size-3.5" aria-hidden />
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}

      <p className="flex items-center gap-1.5 text-xs text-muted">
        <MapPin className="size-4 text-sky" aria-hidden />
        Rute lanjutan dapat ditambahkan dari halaman detail rencana perjalanan.
      </p>
    </div>
  );
}
