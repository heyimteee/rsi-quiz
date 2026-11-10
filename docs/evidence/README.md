# Bukti Pengujian

Screenshot di folder ini diambil dari **build produksi** dengan database demo yang di-reset
dari seed pada 6 November 2026:

```bash
npm run db:reset
npm run build
npm run start -- -p 3100
# screenshot diambil dari http://127.0.0.1:3100
```

Build produksi dipakai agar overlay developer Next.js tidak ikut terbawa. E2E otomatis
berjalan terpisah memakai `next dev` pada port `3210` dan `prisma/e2e.db`; jadi bukti
screenshot (produksi) dan bukti E2E (dev server + DB terisolasi) adalah dua artefak berbeda.

## Screenshot

| File | Halaman / bukti |
|---|---|
| `screenshots/01-login.png` | Login + akun demo |
| `screenshots/02-hrd-cuti.png` | Daftar cuti + filter periode |
| `screenshots/03-hrd-detail.png` | Detail pengajuan + hak cuti |
| `screenshots/04-hrd-history.png` | Riwayat + rekap per tahun |
| `screenshots/05-flight-search.png` | Hasil pencarian penerbangan |
| `screenshots/06-flight-detail.png` | Detail penerbangan + form |
| `screenshots/07-compare.png` | Perbandingan dua tujuan |
| `screenshots/08-roundtrip.png` | Pemilihan pulang-pergi |
| `screenshots/09-booking-detail.png` | E-tiket + pembatalan |
| `screenshots/10-member-search.png` | Perbandingan harga member |
| `screenshots/11-member-profile.png` | Profil + checklist |
| `screenshots/12-member-validation-rejected.png` | Pesan `Data profil tidak lengkap` |
| `screenshots/13-member-itinerary.png` | Rencana perjalanan |
| `screenshots/14-member-multi.png` | Hasil multi-destinasi |
| `screenshots/15-travel-bookings.png` | Status + filter pemesanan |
| `screenshots/16-travel-verify-invalid.png` | Pesan kode booking tidak sesuai |
| `screenshots/17-travel-verify-valid.png` | Status booking valid |
| `screenshots/18-travel-visitor-form.png` | Pemesanan untuk pengunjung (NIK ter-mask) |
| `screenshots/19-email-outbox.png` | Email outbox simulasi |
| `screenshots/20-visitor-tickets.png` | Tiket pengunjung |
| `screenshots/21-mobile-hrd.png` | HRD pada 390px |
| `screenshots/22-mobile-travel.png` | Travel pada 390px |

## Verifikasi manual

Kasus blackbox bertanda `[M]` dicatat pada [`manual-verification.md`](manual-verification.md)
beserta input, hasil, dan bukti screenshot bila tersedia.

## Log yang dapat dihasilkan ulang

```bash
npm run verify:full
```

Artefak:
- `coverage/index.html` — laporan coverage.
- `coverage/coverage-summary.json` — ringkasan mesin.
- `playwright-report/index.html` — laporan E2E.
- `test-results/` — trace/screenshot kegagalan (jika ada).

## Catatan

- Screenshot adalah bukti tampilan, bukan bukti tunggal kebenaran data. Assertion otomatis
  pada unit/E2E adalah bukti utama.
- Data usability adalah simulasi; lihat disclaimer di `../04-usability-testing.md`.
