# TravelKu — Sistem Informasi Perjalanan & Manajemen Cuti

Implementasi bertahap 10 studi kasus RSI dalam satu aplikasi Next.js.

Status saat ini:
- Fondasi: autentikasi, peran, database, seed, desain — selesai.
- Studi kasus 01 (cuti HRD): daftar berbasis periode, detail, riwayat, dan sisa hak cuti — selesai.
- Studi kasus 02 (cari, pesan, batalkan tiket) — selesai.
- Studi kasus 03 (bandingkan dua tujuan) — selesai.
- Studi kasus 04 (multi-destinasi & rencana perjalanan) — selesai.
- Studi kasus 05 (profil & validasi tiket) — selesai.
- Studi kasus 06 (preferensi, perbandingan harga, pemesanan member) — selesai.
- Studi kasus 07 (status & filter pemesanan) — selesai.
- Studi kasus 08 (pemesanan untuk pengunjung + e-tiket) — selesai.
- Studi kasus 09 (verifikasi kode booking) — selesai.
- Studi kasus 10 (pulang-pergi) — selesai.
- Dokumentasi pengujian (blackbox, whitebox, usability) — selesai.

Seluruh 10 studi kasus sudah dapat didemokan. Bukti eksekusi terakhir: **165 unit test**,
**48 E2E test**, coverage inti **92,35% statements / 83,97% branches**, build produksi lulus.
Dokumentasi lengkap ada di [`docs/`](docs/README.md).

Modul 01 tersedia di `/hrd/cuti` untuk `hrd@demo.test`. Modul 02, 03, dan 10 tersedia
untuk `penumpang@demo.test`. Modul 04–06 tersedia untuk `member@demo.test`; gunakan
`member2@demo.test` untuk melihat penolakan validasi tiket saat profil belum lengkap.
Modul 07–09 dan kotak email simulasi tersedia untuk `travel@demo.test`; tiket pengunjung
dapat dilihat melalui akun `pengunjung@demo.test`.

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
npm run verify:full    # semua + E2E (dipakai CI)
```

## Dokumentasi pengujian

- [Rencana pengujian](docs/01-rencana-pengujian.md)
- [Blackbox testing](docs/02-blackbox-testing.md)
- [Whitebox testing](docs/03-whitebox-testing.md)
- [Usability testing (simulasi)](docs/04-usability-testing.md)
- [Traceability matrix](docs/05-traceability-matrix.md)
- [Hasil pengujian](docs/06-hasil-pengujian.md)
- [Panduan demo](docs/panduan-demo.md)
- [Pemetaan diagram](docs/pemetaan-diagram.md)

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
tests/unit/             # Vitest (domain, service, action, validation)
tests/e2e/              # Playwright (kasus, authz, IDOR, mobile)
docs/                   # blackbox, whitebox, usability, traceability, evidence
docs/diagram/           # 30 diagram konseptual
```

## Catatan

- Email e-tiket disimulasikan melalui tabel `EmailOutbox` dan halaman `/dev/email`, bukan SMTP sungguhan.
- Pembayaran tidak terhubung ke payment gateway. Status `WAITING_FOR_PAYMENT` dan `BOOKED` tersedia pada data seed untuk kebutuhan filter studi kasus 07.
- Data usability pada dokumen pengujian merupakan simulasi yang diberi label jelas, bukan partisipan nyata.
