# 06 — Hasil Pengujian

**Tanggal eksekusi:** 6–10 November 2026 (eksekusi akhir 10 November 2026)  
**Commit kode:** commit final Sprint 8 (`git log -1 --oneline`)  
**Lingkungan:** macOS, Node.js 26.12.1, Chromium 158, SQLite

## 1. Ringkasan eksekusi

| Pemeriksaan | Perintah | Hasil |
|---|---|---|
| Lint | `npm run lint` | ✅ Lulus, tanpa error |
| Typecheck | `npm run typecheck` | ✅ Lulus |
| Unit + coverage | `npm run test:coverage` | ✅ 165 test / 14 file lulus |
| E2E | `npm run test:e2e` | ✅ 48 test lulus (42,6 detik) |
| Build | `npm run build` | ✅ Lulus (Next.js 16.4.5) |
| Verifikasi penuh | `npm run verify:full` | ✅ Lulus |

## 2. Hasil unit/integration

| Metrik | Hasil | Ambang | Status |
|---|---:|---:|---|
| Statements | 92,35% (592/641) | 85% | ✅ |
| Branches | 83,97% (372/443) | 80% | ✅ |
| Functions | 99,21% (126/127) | 90% | ✅ |
| Lines | 94,19% (519/551) | 85% | ✅ |

**Cakupan:** `src/lib/domain`, `src/lib/services`, tiga file action (`booking`, `member`,
`travel`), dan `src/lib/validation`. Halaman RSC dan sesi JWT tidak termasuk; lihat
`03-whitebox-testing.md`.

## 3. Hasil E2E per area

| Spec | Fokus | Jumlah | Status |
|---|---|---:|---|
| `authz.spec.ts` | Matriks peran + anonymous | 6 | ✅ |
| `idor.spec.ts` | IDOR booking/itinerary/tiket/penerbangan | 4 | ✅ |
| `flights.spec.ts` | Kasus 02, 03, 10 | 7 | ✅ |
| `hrd-leave.spec.ts` | Kasus 01 | 5 | ✅ |
| `member.spec.ts` | Kasus 04, 05, 06 | 7 | ✅ |
| `mobile.spec.ts` | Responsif 390px | 6 | ✅ |
| `smoke.spec.ts` | Login, seed, fondasi | 7 | ✅ |
| `travel.spec.ts` | Kasus 07, 08, 09 | 6 | ✅ |
| **Total** | | **48** | ✅ |

Contoh assertion penting:
- Kode booking baru berformat `TRV-[A-Z0-9]{6}` dan status `Confirmed`.
- Pembatalan mengubah status menjadi `Cancelled` dan tombol batal hilang.
- Halaman pulang-pergi menampilkan total dan 2 segmen; kesetaraan total = jumlah harga
  kedua segmen diuji pada level unit/service.
- Filter `WAITING_FOR_PAYMENT` hanya menampilkan satu pemesanan seed.
- Verifikasi `trv-demo01` (spasi + huruf kecil) menemukan `TRV-DEMO01`.
- NIK penuh tidak ada di HTML halaman pemesanan pengunjung; hanya versi ter-mask.
- 18 rute statis diuji untuk 5 peran; 4 skenario IDOR menghasilkan 404/unauthorized.

## 4. Hasil usability (simulasi)

| Metrik | Hasil |
|---|---:|
| Responden simulasi | 8 |
| Success rate tugas | 93,75% |
| Waktu rata-rata | 139,38 detik |
| Error rata-rata | 0,96 |
| SEQ rata-rata | 5,52 / 7 |
| SUS rata-rata | 89,06 |
| Simpangan baku SUS | 3,52 |

> **Simulasi, bukan partisipan nyata.** Lihat `04-usability-testing.md`.

## 5. Matriks otorisasi (ringkas)

| Peran | Rute diizinkan | Rute ditolak |
|---|---|---|
| HRD | `/hrd/*` | member, travel, tiket, pemesanan, penerbangan |
| Penumpang | `/penerbangan`, `/penerbangan/bandingkan`, `/pulang-pergi`, `/pemesanan` | hrd, member, travel, tiket, email |
| Member | `/member/*`, `/penerbangan`, `/pemesanan` | hrd, travel, tiket, email |
| Travel | `/travel/*`, `/dev/email` | hrd, member, tiket, pemesanan, penerbangan |
| Pengunjung | `/tiket-saya`, `/pemesanan` | hrd, member, travel, penerbangan, pulang-pergi, email |
| Anonymous | `/login` | semua rute terproteksi → redirect login |

## 6. Defect yang ditemukan dan diperbaiki

| ID | Defect | Severity | Perbaikan |
|---|---|---|---|
| D-01 | Penerbangan lewat masih muncul | P1 | Filter `departureAt >= now` untuk hari ini |
| D-02 | Pembatalan race tidak atomik | P1 | `updateMany` bersyarat + transaksi |
| D-03 | Passport terhapus saat booking | P1 | Update opsional hanya jika field dikirim |
| D-04 | Tiket batal dapat divalidasi | P1 | Cek status booking + filter tiket aktif |
| D-05 | NIK penuh di payload client | P2 | Kirim NIK ter-mask |
| D-06 | Rute >4 / tidak tersambung | P2 | Validasi service + action |
| D-07 | Mobile travel table | P2 | Kartu seluler |
| D-08 | Seed message tidak persis | P2 | Pesan persis |
| D-09 | Test tanggal tetap | P2 | Kasus sensitif tanggal memakai tanggal dinamis |
| D-10 | Authz matrix belum lengkap | P1 | 18 rute + 4 IDOR |

**Tidak ada defect P0/P1 terbuka.**

## 7. Bukti

### Screenshot

Folder: [`evidence/screenshots/`](evidence/screenshots/)

| File | Halaman |
|---|---|
| `01-login.png` | Login + akun demo |
| `02-hrd-cuti.png` | Daftar cuti HRD |
| `03-hrd-detail.png` | Detail pengajuan |
| `04-hrd-history.png` | Riwayat + hak cuti |
| `05-flight-search.png` | Hasil pencarian penerbangan |
| `06-flight-detail.png` | Detail + form pemesanan |
| `07-compare.png` | Perbandingan dua tujuan |
| `08-roundtrip.png` | Pemilihan pulang-pergi |
| `09-booking-detail.png` | E-tiket + pembatalan |
| `10-member-search.png` | Perbandingan harga member |
| `11-member-profile.png` | Profil + checklist |
| `12-member-validation-rejected.png` | Penolakan `Data profil tidak lengkap` |
| `13-member-itinerary.png` | Rencana perjalanan |
| `14-member-multi.png` | Hasil multi-destinasi |
| `15-travel-bookings.png` | Status + filter booking |
| `16-travel-verify-invalid.png` | Pesan kode tidak sesuai |
| `17-travel-verify-valid.png` | Status booking valid |
| `18-travel-visitor-form.png` | Pemesanan untuk pengunjung |
| `19-email-outbox.png` | Email outbox simulasi |
| `20-visitor-tickets.png` | Tiket pengunjung |
| `21-mobile-hrd.png` | HRD 390px |
| `22-mobile-travel.png` | Travel 390px |

Verifikasi kasus manual: [`evidence/manual-verification.md`](evidence/manual-verification.md).

### Log dan artefak

- [`evidence/verify-full.log`](evidence/verify-full.log) — log lengkap
  `npm run verify:full` (exit 0, 165 unit test, 48 E2E).
- `coverage/coverage-summary.json` dan `coverage/index.html` (dihasilkan ulang oleh perintah).
- `playwright-report/index.html` dan `test-results/` (trace/screenshot saat gagal).
- Dokumen ini, `02-blackbox-testing.md`, `03-whitebox-testing.md`,
  `04-usability-testing.md`, `05-traceability-matrix.md`.

## 8. Peringatan non-blocking

- Prisma 6.19.3 memberi peringatan deprecation `package.json#prisma` (akan pindah ke
  `prisma.config.ts` pada Prisma 7).
- Vitest memberi peringatan konfigurasi ESM/CJS (`vitest.config.ts`); test tetap lulus.
- `npm audit` melaporkan advisory pada rantai dependensi Prisma; perbaikan memerlukan upgrade
  mayor dan tidak dilakukan dalam lingkup tugas.
- Next.js dev overlay dan `scroll-behavior` sudah ditangani; tidak ada page error pada
  screenshot produksi.

## 9. Kesimpulan

1. Seluruh 10 studi kasus dan acceptance criteria utama dapat didemonstrasikan.
2. Jalur normal, alternatif, error, dan otorisasi memiliki bukti otomatis.
3. Kualitas kode terjaga oleh lint, typecheck, build, dan ambang coverage.
4. Tidak ada defect P0/P1 terbuka.
5. Keterbatasan (email/payment simulasi, cakupan coverage modul inti, usability simulasi,
   E2E serial, beberapa tabel mobile) telah didokumentasikan.
6. Aplikasi siap digunakan untuk demo tugas dan pengumpulan dokumentasi.
