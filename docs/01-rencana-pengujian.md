# 01 — Rencana Pengujian

## 1. Identitas

| Item | Keterangan |
|---|---|
| Proyek | TravelKu — Sistem Informasi Perjalanan & Manajemen Cuti |
| Mata kuliah | Rekayasa Sistem Informasi (RSI) |
| Penulis | Tristant AI Harrish Basori (245150407141002) |
| Tanggal eksekusi | 6–10 November 2026 (eksekusi akhir 10 November 2026) |
| Commit acuan | `b167543` (kode) + commit dokumentasi |
| Lingkungan | macOS, Node.js 26.12.1, npm 11.21.1 |

## 2. Tujuan

1. Memverifikasi kesesuaian implementasi dengan 10 studi kasus, task, dan acceptance criteria.
2. Memastikan aturan bisnis inti (cuti, pencarian, pemesanan, pembatalan, validasi, status,
   verifikasi) berjalan benar pada jalur normal dan jalur alternatif.
3. Memastikan kontrol akses berbasis peran dan kepemilikan data tidak dapat dilewati.
4. Menyediakan bukti pengujian yang dapat direproduksi (unit, E2E, screenshot, coverage).
5. Menyediakan evaluasi usability berbasis simulasi sebagai pelengkap, dengan batasan yang jelas.

## 3. Ruang lingkup

### Termasuk

- Studi kasus 01–10: HRD leave, pencarian/pemesanan/pembatalan tiket, perbandingan tujuan,
  multi-destinasi, profil dan validasi tiket, preferensi member, status pemesanan travel,
  pemesanan untuk pengunjung, verifikasi kode booking, dan pulang-pergi.
- Autentikasi, otorisasi peran, kepemilikan data (IDOR), validasi input, transaksi kursi,
  pembuatan e-tiket dan email simulasi.
- Pengujian responsif pada 390×844 dan desktop.
- Unit test domain/service/action, E2E Playwright, usability simulasi.

### Tidak termasuk

- Pengujian beban, stres, atau konkurensi tingkat produksi.
- Pengujian penetrasi menyeluruh, SAST/DAST, atau audit dependensi mendalam.
- Integrasi SMTP nyata, payment gateway, atau layanan pihak ketiga.
- Penelitian usability dengan manusia nyata (data yang tersedia adalah simulasi).
- Pengujian lintas browser selain Chromium (Firefox/WebKit tidak dijalankan).
- Aksesibilitas formal dengan pembaca layar (hanya pemeriksaan dasar label/fokus).

## 4. Lingkungan pengujian

| Komponen | Versi / konfigurasi |
|---|---|
| Framework | Next.js 16.4.5 (App Router, Turbopack) |
| Bahasa | TypeScript 5.9 |
| UI | React 19.2, Tailwind CSS 4 |
| Database | SQLite via Prisma 6.19.3 |
| Unit test | Vitest 5.1.0, @vitest/coverage-v8 |
| E2E | Playwright 1.65, Chromium 158 |
| Node | 26.12.1 (lokal), target CI Node 22 |
| Zona waktu | `Asia/Jakarta` |
| Port E2E | `3210` dengan `prisma/e2e.db` |
| Port demo | `3000` (dev) / `3100` (produksi) |

## 5. Strategi pengujian

| Level | Teknik | Cakupan |
|---|---|---|
| Unit | Equivalence partitioning, boundary value, branch/path testing | Domain murni: cuti, flight, booking, profile; validasi Zod |
| Integration/service | Mock Prisma, transaction shape, error mapping | Service booking, leave, member, itinerary, flight, travel |
| Action | Mock session + service, role/error/redirect branches | Booking, member, travel actions |
| E2E | Scenario-based, role matrix, IDOR, responsive | Semua 10 kasus, autentikasi, otorisasi |
| Blackbox | EP, BVA, decision table, state transition, negative testing | Tabel 70+ kasus di `02-blackbox-testing.md` |
| Whitebox | Flowgraph, cyclomatic complexity, basis path, coverage | 3 fungsi utama + fungsi pendukung |
| Usability | Task-based testing + SUS + SEQ (simulasi) | 8 responden simulasi, 6 tugas |

Pendekatan utama:
- **Verifikasi di server**, bukan hanya UI: role, kepemilikan, harga, kursi, dan referensi
  dihitung/diambil ulang di server.
- **Assertion bermakna**: status, angka, pesan persis, jumlah baris, dan efek samping
  (kursi, tiket, email) — bukan sekadar “halaman terbuka”.
- **Data relatif tanggal**: seed dan test memakai tanggal dinamis agar tidak kedaluwarsa.
- **Database terpisah**: E2E memakai `e2e.db` dan mereset seed setiap run.

## 6. Data uji

Seed baseline:

| Data | Jumlah |
|---|---:|
| User | 9 |
| Pegawai | 8 |
| Pengajuan cuti | 24 |
| Bandara | 6 |
| Maskapai | 4 |
| Penerbangan | 704 (hari 0–21) |
| Pemesanan | 10 (`TRV-DEMO01`–`TRV-DEMO10`) |
| Tiket | 10 |
| Rencana perjalanan | 2 |
| Email outbox | 2 |
| Riwayat validasi | 1 |

Status pemesanan seed: `CONFIRMED` (6), `BOOKED` (2), `WAITING_FOR_PAYMENT` (1),
`CANCELLED` (1). Status cuti: `APPROVED`, `PENDING`, `REJECTED`.

Akun khusus:
- `member2@demo.test` — profil tanpa NIK dan tanggal lahir.
- `sari.visitor@demo.test` — pengunjung tanpa tiket.
- `pelanggan@demo.test` — memiliki pemesanan aktif dan batal.

## 7. Kriteria masuk dan keluar

### Masuk

- Dependensi terpasang, database dapat di-reset dan di-seed.
- `npm run lint`, `npm run typecheck`, dan `npm run build` lulus.
- Aplikasi dapat diakses dan akun demo dapat login.
- Data seed tersedia dan konsisten.

### Keluar

- Seluruh acceptance criteria memiliki minimal satu bukti uji.
- Tidak ada defect P0/P1 terbuka.
- Unit test, E2E, lint, typecheck, dan build lulus.
- Coverage memenuhi ambang: statements ≥85%, branches ≥80%, functions ≥90%, lines ≥85%.
- Dokumen blackbox, whitebox, usability, traceability, dan hasil eksekusi lengkap.
- Known limitations terdokumentasi.

## 8. Perintah eksekusi

```bash
npm run lint            # ESLint
npm run typecheck       # tsc --noEmit
npm run test:coverage   # Vitest + coverage
npm run test:e2e        # Playwright (e2e.db, port 3210)
npm run build           # build produksi
npm run verify:full     # semua di atas secara berurutan
```

## 9. Risiko dan mitigasi

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Data seed bergantung tanggal | Test gagal saat pergantian bulan/tahun | Tanggal relatif + helper dinamis; perbaiki formula jumlah cuti musiman |
| E2E berbagi database | Test saling memengaruhi | Satu worker, reset per run, assertion spesifik/lenient |
| Mock Prisma tidak identik dengan DB nyata | Bug query lolos unit test | E2E menutupi alur nyata; service test menjaga shape query |
| Waktu/uom lintas zona | Penerbangan salah hari | `TZ=Asia/Jakarta` pada server E2E; helper tanggal lokal |
| Data pribadi (NIK) bocor ke client | Pelanggaran privasi | Hanya NIK ter-mask yang dikirim ke props client; diuji E2E |
| Usability simulasi disalahartikan | Klaim berlebihan | Label “SIMULASI” di semua artefak |
| Coverage terbatas pada modul inti | Rasa aman berlebih | Cakupan dinyatakan eksplisit; halaman diverifikasi E2E |

## 10. Jadwal sprint

| Sprint | Fokus | Status |
|---|---|---|
| 1 | Fondasi, auth, schema, seed | Selesai |
| 2 | Studi kasus 01 | Selesai |
| 3 | Studi kasus 02, 03, 10 | Selesai |
| 4 | Studi kasus 04, 05, 06 | Selesai |
| 5 | Studi kasus 07, 08, 09 | Selesai |
| 6 | Otomasi, authz matrix, mobile, coverage | Selesai |
| 7 | Dokumentasi blackbox/whitebox/usability | Selesai |
| 8 | Verifikasi akhir dan perbaikan polish | Selesai |
