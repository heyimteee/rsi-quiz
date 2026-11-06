# TravelKu — Sistem Informasi Perjalanan & Manajemen Cuti

Implementasi bertahap 10 studi kasus RSI dalam satu aplikasi Next.js.

Status saat ini:
- Fondasi: autentikasi, peran, database, seed, desain — selesai.
- Studi kasus 01 (cuti HRD): daftar berbasis periode, detail, riwayat, dan sisa hak cuti — selesai.
- Studi kasus 02 (cari, pesan, batalkan tiket) — selesai.
- Studi kasus 03 (bandingkan dua tujuan) — selesai.
- Studi kasus 10 (pulang-pergi) — selesai.
- Studi kasus 04–09 dan dokumentasi pengujian — sprint berikutnya.

Modul 01 tersedia di `/hrd/cuti` untuk `hrd@demo.test`. Modul 02, 03, dan 10 tersedia
untuk `penumpang@demo.test` melalui menu Calon Penumpang.

1. Pengajuan dan riwayat cuti pegawai (Manajer HRD)
2. Pencarian, pemesanan, dan pembatalan tiket pesawat
3. Perbandingan dua tujuan penerbangan
4. Pencarian multi-destinasi untuk member frequent traveller
5. Pembaruan profil dan validasi tiket
6. Pencarian sesuai preferensi, perbandingan harga, dan pemesanan (member)
7. Melihat dan memfilter status pemesanan (Manajer Travel)
8. Pemesanan tiket untuk pengunjung (Manajer Travel)
9. Otorisasi tiket dengan kode booking reference
10. Pemesanan tiket pulang-pergi

## Menjalankan aplikasi

```bash
npm install
cp .env.example .env
npm run db:reset
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000).

## Akun demo

Kata sandi semua akun: `password123`

| Peran | Email | Kegunaan |
|---|---|---|
| Manajer HRD | `hrd@demo.test` | Studi kasus 01 |
| Calon Penumpang | `penumpang@demo.test` | Studi kasus 02, 03, 10 |
| Pelanggan | `pelanggan@demo.test` | Riwayat pemesanan dan pembatalan |
| Member lengkap | `member@demo.test` | Studi kasus 04, 05, 06 |
| Member belum lengkap | `member2@demo.test` | Jalur alternatif validasi tiket |
| Manajer Travel | `travel@demo.test` | Studi kasus 07, 08, 09 |
| Pengunjung | `pengunjung@demo.test` | Melihat tiket yang dipesankan manajer |
| Pengunjung lain | `budi.visitor@demo.test` | Data pengunjung tambahan |

Halaman login menyediakan tombol masuk cepat untuk akun demo. Masuk cepat hanya aktif
jika `DEMO_MODE="true"` pada environment; untuk deployment nyata set `DEMO_MODE="false"`
dan gunakan `SESSION_SECRET` acak minimal 32 karakter. `.env.example` hanya untuk lokal.

## Perintah

```bash
npm run dev            # server pengembangan
npm run build          # build produksi
npm run lint           # ESLint
npm run typecheck      # TypeScript
npm run db:reset       # reset database + seed (mode demo)
npm run db:push        # sinkronkan schema tanpa reset
npm run test           # unit test Vitest
npm run test:coverage  # unit test + coverage
npm run test:e2e       # Playwright E2E
npm run verify         # lint + typecheck + coverage + build
```

## Stack

- Next.js App Router + TypeScript
- Prisma ORM + SQLite
- Tailwind CSS 4
- Vitest + Playwright
- Autentikasi cookie bertanda tangan (JWT) dan otorisasi berbasis peran

## Struktur penting

```
prisma/schema.prisma    # model data
prisma/migrations/      # migrasi SQL baseline
prisma/seed.ts          # data demo relatif terhadap tanggal hari ini
src/lib/domain/         # logika bisnis murni (target whitebox testing)
src/lib/services/       # query dan transaksi
src/app/(app)/          # halaman setelah login
src/app/login/          # autentikasi
docs/                   # dokumen pengujian (ditambahkan pada sprint dokumentasi)
```

## Catatan

- Email e-tiket disimulasikan melalui tabel `EmailOutbox` dan halaman `/dev/email`, bukan SMTP sungguhan.
- Pembayaran tidak terhubung ke payment gateway. Status `WAITING_FOR_PAYMENT` dan `BOOKED` tersedia pada data seed untuk kebutuhan filter studi kasus 07.
- Data usability pada dokumen pengujian merupakan simulasi yang diberi label jelas, bukan partisipan nyata.
