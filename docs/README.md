# Dokumentasi Pengujian — TravelKu

Repositori ini berisi implementasi 10 studi kasus RSI dalam satu aplikasi Next.js, beserta
dokumen pengujian blackbox, whitebox, dan usability.

> **Catatan penting:** data usability pada folder `usability/` adalah **data simulasi**
> untuk keperluan demonstrasi akademik, bukan data partisipan nyata. Setiap tabel dan
> kesimpulan usability diberi label simulasi.

## Ringkasan hasil

| Jenis pengujian | Alat | Hasil |
|---|---|---:|
| Unit / integration | Vitest 5.1.0 | **165 test lulus** (14 file) |
| End-to-end | Playwright 1.65 + Chromium | **48 test lulus** |
| Statement coverage | V8 / Vitest | **92,35%** |
| Branch coverage | V8 / Vitest | **83,97%** |
| Function coverage | V8 / Vitest | **99,21%** |
| Line coverage | V8 / Vitest | **94,19%** |
| Build produksi | Next.js 16.4.5 | **Lulus** |
| Lint & typecheck | ESLint + TypeScript | **Lulus** |
| Usability (simulasi) | SUS + metrik tugas | **SUS 89,06** (simulasi) |

Cakupan coverage di atas adalah **cakupan modul inti** (`src/lib/domain`, `src/lib/services`,
tiga file action, dan `src/lib/validation`), bukan seluruh halaman React. Batas cakupan ini
dijelaskan di `03-whitebox-testing.md` dan `06-hasil-pengujian.md`.

## Daftar dokumen

| Dokumen | Isi |
|---|---|
| [`01-rencana-pengujian.md`](01-rencana-pengujian.md) | Rencana, strategi, lingkungan, kriteria masuk/keluar, risiko |
| [`02-blackbox-testing.md`](02-blackbox-testing.md) | 70+ kasus uji, matriks otorisasi, IDOR, pesan error, defect log |
| [`03-whitebox-testing.md`](03-whitebox-testing.md) | Flowgraph, cyclomatic complexity, basis path, coverage |
| [`04-usability-testing.md`](04-usability-testing.md) | Studi usability simulasi, SUS, temuan, rekomendasi |
| [`05-traceability-matrix.md`](05-traceability-matrix.md) | Keterlacakan acceptance criteria → route → test |
| [`06-hasil-pengujian.md`](06-hasil-pengujian.md) | Rekap eksekusi, bukti, defect, kesimpulan |
| [`panduan-demo.md`](panduan-demo.md) | Skenario demo per studi kasus |
| [`pemetaan-diagram.md`](pemetaan-diagram.md) | Pemetaan 10 studi kasus ke diagram konseptual |
| [`usability/`](usability/) | Instrumen SUS, skenario tugas, data simulasi, hasil hitung |
| [`evidence/`](evidence/) | Screenshot, log `verify:full`, ringkasan bukti eksekusi |
| [`diagram/`](diagram/) | 30 diagram konseptual (use case, robustness, sequence) |

## Cara mereproduksi

```bash
npm install
cp .env.example .env
npm run db:reset
npm run verify:full
```

`verify:full` menjalankan lint, typecheck, unit test + coverage, E2E pada database terpisah,
dan build produksi. E2E memakai port `3210` dan database `prisma/e2e.db`; database demo
(`prisma/dev.db`) tidak tercampur.

Untuk menjalankan aplikasi demo:

```bash
npm run dev
# buka http://localhost:3000
```

Kata sandi semua akun demo: `password123`.

## Akun demo

| Peran | Email | Studi kasus |
|---|---|---|
| Manajer HRD | `hrd@demo.test` | 01 |
| Calon Penumpang | `penumpang@demo.test` | 02, 03, 10 |
| Pelanggan | `pelanggan@demo.test` | 02 (pembatalan) |
| Member lengkap | `member@demo.test` | 04, 05, 06 |
| Member belum lengkap | `member2@demo.test` | 05 (jalur penolakan) |
| Manajer Travel | `travel@demo.test` | 07, 08, 09 |
| Pengunjung | `pengunjung@demo.test` | 08 |
| Pengunjung lain | `budi.visitor@demo.test` | 08 / IDOR |
| Pengunjung tanpa tiket | `sari.visitor@demo.test` | 08 (empty state) |

## Batasan yang diketahui

- Email e-tiket disimulasikan melalui tabel `EmailOutbox` dan halaman `/dev/email`; tidak ada SMTP.
- Pembayaran disimulasikan; tidak ada payment gateway.
- Data usability adalah simulasi, bukan penelitian manusia nyata.
- E2E dijalankan serial (`workers: 1`) dan mereset database sekali per run; test yang membuat
  data tidak diisolasi per test.
- Halaman HRD dan tabel perbandingan member masih menggunakan tabel yang dapat digeser
  horizontal di layar sangat kecil; halaman travel sudah memakai kartu seluler.
- Coverage tidak mencakup seluruh halaman RSC, hooks, atau sesi JWT; lihat batas cakupan.
