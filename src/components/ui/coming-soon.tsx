import Link from "next/link";
import { ArrowRight, Hammer } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";

export function ComingSoon({
  caseNumber,
  title,
  description,
}: {
  caseNumber: string;
  title: string;
  description: string;
}) {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={`Studi Kasus ${caseNumber}`}
        title={title}
        description={description}
        actions={
          <Link href="/" className="btn-secondary">
            Kembali ke beranda
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        }
      />
      <div className="card flex flex-col items-center justify-center px-6 py-16 text-center">
        <span className="flex size-14 items-center justify-center rounded-2xl bg-amber-soft text-amber-700">
          <Hammer className="size-7" aria-hidden />
        </span>
        <h2 className="mt-4 text-lg font-bold">Modul sedang disiapkan</h2>
        <p className="mt-1 max-w-md text-sm text-muted">
          Halaman ini akan tersedia pada sprint implementasi berikutnya. Struktur navigasi dan
          autentikasi sudah siap digunakan.
        </p>
      </div>
    </div>
  );
}
