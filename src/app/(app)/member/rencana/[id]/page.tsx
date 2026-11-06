import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { addDays } from "date-fns";
import { ArrowLeft, CalendarDays, MapPin, Plus, Route, Search } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Alert } from "@/components/ui/alert";
import { AddSegmentForm } from "@/components/member/add-segment-form";
import { requireRole } from "@/lib/auth/session";
import { getAirports } from "@/lib/services/flight-service";
import { getItinerary } from "@/lib/services/itinerary-service";
import { firstParam, formatDate, toDateInputValue } from "@/lib/utils";

export const metadata: Metadata = { title: "Detail Rencana Perjalanan" };

type SearchParams = Promise<{ baru?: string; sukses?: string }>;



export default async function ItineraryDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: SearchParams;
}) {
  const user = await requireRole("MEMBER");
  const { id } = await params;
  const query = await searchParams;
  const [itinerary, airports] = await Promise.all([getItinerary(id, user.id), getAirports()]);
  if (!itinerary) notFound();

  const last = itinerary.segments[itinerary.segments.length - 1];
  const first = itinerary.segments[0];
  const defaultOrigin = last?.destinationId ?? airports.find((airport) => airport.code === "CGK")?.id ?? "";
  const defaultDestination =
    first && first.originId !== defaultOrigin
      ? first.originId
      : (airports.find((airport) => airport.id !== defaultOrigin)?.id ?? "");
  const defaultDate = toDateInputValue(
    last ? addDays(new Date(last.departureDate), 2) : addDays(new Date(), 3),
  );

  return (
    <div className="space-y-6">
      <Link
        href="/member/rencana"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-ink"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Kembali ke rencana perjalanan
      </Link>

      {firstParam(query.baru) ? (
        <Alert variant="success" title="Rencana perjalanan tersimpan">
          Rute berhasil disimpan. Anda dapat menambahkan rute lanjutan atau langsung mencari
          penerbangan multi-destinasi.
        </Alert>
      ) : null}
      {firstParam(query.sukses) ? (
        <Alert variant="success" title="Rute lanjutan berhasil ditambahkan">
          Rute baru sudah masuk ke rencana perjalanan. Periksa urutan tanggalnya sebelum mencari
          penerbangan.
        </Alert>
      ) : null}

      <PageHeader
        eyebrow="Studi Kasus 04 · Rencana Perjalanan"
        title={itinerary.name}
        description={`${itinerary.segments.length} rute perjalanan · dibuat ${formatDate(itinerary.createdAt)}`}
        actions={
          <Link
            href={`/member/pencarian-multi?itineraryId=${itinerary.id}&cari=1`}
            className="btn-primary"
          >
            <Search className="size-4" aria-hidden />
            Cari penerbangan
          </Link>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <section className="card p-5" aria-labelledby="rute-tersimpan">
          <div className="flex items-center gap-2">
            <Route className="size-5 text-sky" aria-hidden />
            <h2 id="rute-tersimpan" className="section-title">
              Rute perjalanan
            </h2>
          </div>
          <ol className="mt-4 space-y-3">
            {itinerary.segments.map((segment, index) => (
              <li
                key={segment.id}
                className="relative flex gap-3 rounded-xl border border-line p-3.5"
                data-testid="itinerary-segment"
              >
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-sky-soft text-xs font-bold text-sky">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">
                    {segment.origin.city} ({segment.origin.code}){" "}
                    <span className="text-muted">→</span> {segment.destination.city} (
                    {segment.destination.code})
                  </p>
                  <p className="mt-1 flex items-center gap-1 text-xs text-muted">
                    <CalendarDays className="size-3.5" aria-hidden />
                    {formatDate(segment.departureDate)}
                  </p>
                </div>
                {index === itinerary.segments.length - 1 ? (
                  <span className="badge self-start bg-green-soft text-emerald-800">Tujuan akhir</span>
                ) : null}
              </li>
            ))}
          </ol>
        </section>

        <section className="card p-5" aria-labelledby="tambah-rute">
          <div className="flex items-center gap-2">
            <Plus className="size-5 text-sky" aria-hidden />
            <h2 id="tambah-rute" className="section-title">
              Tambah rute lanjutan
            </h2>
          </div>
          <p className="mt-1 text-xs text-muted">
            Rute baru otomatis ditempatkan setelah rute terakhir. Tanggal tidak boleh lebih awal
            daripada rute sebelumnya.
          </p>
          <div className="mt-4">
            <AddSegmentForm
              itineraryId={itinerary.id}
              airports={airports.map((airport) => ({
                id: airport.id,
                code: airport.code,
                city: airport.city,
              }))}
              defaultOrigin={defaultOrigin}
              defaultDestination={defaultDestination}
              defaultDate={defaultDate}
            />
          </div>
          <div className="mt-5 rounded-xl bg-canvas p-3 text-xs leading-relaxed text-muted">
            <MapPin className="mb-1 inline size-3.5 text-sky" aria-hidden /> Setelah rute lengkap,
            gunakan tombol “Cari penerbangan” untuk mencari jadwal dan harga setiap segmen.
          </div>
        </section>
      </div>
    </div>
  );
}
