import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { addDays } from "date-fns";
import { PageHeader } from "@/components/ui/page-header";
import { ItineraryBuilder } from "@/components/member/itinerary-builder";
import { requireRole } from "@/lib/auth/session";
import { getAirports } from "@/lib/services/flight-service";
import { toDateInputValue } from "@/lib/utils";

export const metadata: Metadata = { title: "Buat Rencana Perjalanan" };

export default async function NewItineraryPage() {
  await requireRole("MEMBER");
  const airports = await getAirports();
  const defaultDate = toDateInputValue(addDays(new Date(), 3));

  return (
    <div className="space-y-6">
      <Link
        href="/member/rencana"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-ink"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Kembali ke rencana perjalanan
      </Link>
      <PageHeader
        eyebrow="Studi Kasus 04 · Rencana Perjalanan"
        title="Buat Rencana Perjalanan"
        description="Tambahkan rute awal dan rute lanjutan. Tanggal setiap rute harus berurutan."
      />
      <section className="card p-5 sm:p-6">
        <ItineraryBuilder
          airports={airports.map((airport) => ({
            id: airport.id,
            code: airport.code,
            city: airport.city,
          }))}
          defaultDate={defaultDate}
        />
      </section>
    </div>
  );
}
