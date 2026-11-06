import Link from "next/link";
import { Compass, Plane } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4">
      <div className="card w-full max-w-lg p-8 text-center">
        <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-sky-soft text-sky">
          <Compass className="size-7" aria-hidden />
        </span>
        <p className="mt-4 text-5xl font-extrabold tracking-tight text-navy">404</p>
        <h1 className="mt-2 text-xl font-bold">Halaman tidak ditemukan</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Data yang Anda cari tidak tersedia atau alamat halaman sudah berubah. Periksa kembali
          tautan, atau kembali ke halaman utama sesuai peran Anda.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Link href="/" className="btn-primary">
            <Plane className="size-4" aria-hidden />
            Kembali ke beranda
          </Link>
          <Link href="/login" className="btn-secondary">
            Halaman masuk
          </Link>
        </div>
      </div>
    </div>
  );
}
