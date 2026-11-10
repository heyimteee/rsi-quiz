# 05 — Traceability Matrix

Matriks ini menghubungkan user story/task/acceptance criteria ke route implementasi, kasus uji
blackbox, test otomatis, dan bukti. Semua item berstatus **Terpenuhi** kecuali yang ditandai.

## 1. Matriks acceptance criteria

| # | Acceptance criteria (ringkas) | Route | Bukti blackbox | Test otomatis |
|---|---|---|---|---|
| 01a | HRD memilih periode cuti semua pegawai | `/hrd/cuti` | BB-01-01, 01-02, 01-03, 01-07, 01-08 | `hrd-leave.spec.ts`; `leave.test.ts` |
| 01b | HRD melihat pengajuan masing-masing pegawai | `/hrd/cuti/[id]` | BB-01-04 | `hrd-leave.spec.ts`; `leave-service.test.ts` |
| 01c | HRD melihat riwayat & sisa cuti | `/hrd/pegawai/[id]/cuti` | BB-01-05, 01-06 | `hrd-leave.spec.ts`; `leave-service.test.ts` |
| 02a | Cari jadwal sesuai tujuan | `/penerbangan` | BB-02-01, 02-05, 02-06 | `flights.spec.ts`; `flight-service.test.ts` |
| 02b | Lihat harga tiap maskapai | `/penerbangan/[id]` | BB-02-02 | `flights.spec.ts`; `flight.test.ts` |
| 02c | Pesan tiket sesuai preferensi | `/penerbangan/[id]` → `/pemesanan/[id]` | BB-02-03 | `flights.spec.ts`; `booking-service.test.ts`; `booking-actions.test.ts` |
| 02-extra | Batalkan pemesanan | `/pemesanan/[id]` | BB-02-04, 02-09, 02-10 | `flights.spec.ts`; `booking-service.test.ts` |
| 03a | Cari jadwal beberapa tujuan | `/penerbangan/bandingkan` | BB-03-01, 03-04 | `flights.spec.ts` |
| 03b | Lihat jadwal, maskapai, harga | `/penerbangan/bandingkan` | BB-03-01, 03-05, 03-06 | `flights.spec.ts`; `flight.test.ts` |
| 04a | Cari multi-destinasi berdasarkan tanggal | `/member/pencarian-multi` | BB-04-03, 04-04 | `member.spec.ts` |
| 04b | Cari berdasarkan lokasi keberangkatan | `/member/pencarian-multi` | BB-04-04 | `member.spec.ts` |
| 04c | Cari berdasarkan tujuan | `/member/pencarian-multi` | BB-04-03, 04-04 | `member.spec.ts` |
| 04-extra | Menyusun rute lanjutan | `/member/rencana`, `/member/rencana/[id]` | BB-04-01, 04-02, 04-05, 04-06 | `member.spec.ts`; `itinerary-service.test.ts`; `member-actions.test.ts` |
| 05a | Update data profil | `/member/profil` | BB-05-01, 05-02, 05-09 | `member.spec.ts`; `member-actions.test.ts` |
| 05b | Validasi tiket dengan data profil | `/member/validasi` | BB-05-05, 05-06, 05-07, 05-08 | `member.spec.ts`; `member-service.test.ts` |
| 05c | Tolak validasi + pesan `Data profil tidak lengkap` | `/member/validasi` | BB-05-03, 05-04 | `member.spec.ts`; `member-service.test.ts`; `profile.test.ts` |
| 06a | Lihat penerbangan sesuai preferensi | `/member/penerbangan` | BB-06-01, 06-02 | `member.spec.ts`; `flight.test.ts`; `flight-service.test.ts` |
| 06b | Bandingkan harga tiket | `/member/penerbangan` | BB-06-03, 06-04, 06-07 | `member.spec.ts`; `flight.test.ts` |
| 06c | Pesan tiket sesuai pilihan | `/penerbangan/[id]` | BB-06-05 | `member.spec.ts`; `booking-service.test.ts` |
| 07a | Lihat semua status booking | `/travel/pemesanan` | BB-07-01, 07-03 | `travel.spec.ts` |
| 07b | Filter status sesuai preferensi | `/travel/pemesanan?status=` | BB-07-02, 07-03 | `travel.spec.ts`; `booking.test.ts` |
| 08a | Cari tiket untuk pengunjung | `/travel/cari` | BB-08-01, 08-02 | `travel.spec.ts` |
| 08b | Pesan dengan data pengunjung | `/travel/pesan/[flightId]` | BB-08-03, 08-04 | `travel.spec.ts`; `travel-actions.test.ts` |
| 08c | Pengunjung melihat tiket di akun | `/tiket-saya`, `/pemesanan/[id]` | BB-08-05, 08-07 | `travel.spec.ts`; `idor.spec.ts` |
| 08d | Pengunjung menerima e-tiket via email | `/dev/email` | BB-08-06 | `travel.spec.ts` |
| 09a | Otorisasi tiket dengan kode booking | `/travel/verifikasi` | BB-09-01…09-04, 09-07 | `travel.spec.ts`; `booking.test.ts` |
| 09b | Lihat status booking | `/travel/verifikasi` | BB-09-04, 09-05 | `travel.spec.ts` |
| 10a | Tentukan asal & tujuan | `/pulang-pergi` | BB-10-01 | `flights.spec.ts` |
| 10b | Tentukan tanggal berangkat & pulang | `/pulang-pergi` | BB-10-01, 10-02, 10-06 | `flights.spec.ts`; `booking.test.ts` |
| 10c | Tampilkan pilihan pulang-pergi | `/pulang-pergi` | BB-10-01, 10-03 | `flights.spec.ts` |
| 10d | Pilih keberangkatan & kepulangan | `/pulang-pergi/penumpang` | BB-10-04, 10-08 | `flights.spec.ts` |
| 10e | Lihat jadwal, maskapai, total | `/pulang-pergi/penumpang` | BB-10-04 | `flights.spec.ts` |
| 10f | Pesan dengan identitas | `/pulang-pergi/penumpang` | BB-10-05 | `flights.spec.ts`; `booking-service.test.ts` |
| 10g | Simpan + tampilkan kode referensi | `/pemesanan/[id]` | BB-10-05 | `flights.spec.ts`; `booking-actions.test.ts` |
| 10h | Error tanggal pulang / tidak ada penerbangan | `/pulang-pergi` | BB-10-02, 10-03 | `flights.spec.ts`; `booking.test.ts` |

## 2. User story → fitur

| Studi kasus | User story | Fitur implementasi |
|---|---|---|
| 01 | Melihat daftar, detail, riwayat cuti | Filter periode overlap, detail, riwayat + kuota per tahun |
| 02 | Cari, lihat tiket, pesan, batalkan | Search, detail, booking transaksional, pembatalan atomik |
| 03 | Cari + bandingkan dua tujuan | Two-column comparison, termurah/tercepat |
| 04 | Menyusun rute, cari, bandingkan | Itinerary builder, multi-search per segmen, total termurah |
| 05 | Update profil, lengkapi identitas, validasi | Profile upsert, checklist, gate validasi |
| 06 | Cari preferensi, bandingkan, pesan | Time-window search, price table, booking member |
| 07 | Lihat & filter status booking | Status tabs, counts, search, detail |
| 08 | Cari, pesan pengunjung, lihat tiket, email | Manager search, visitor booking, e-ticket + outbox |
| 09 | Otentikasi/verifikasi kode booking | Normalize + lookup, status card, retry |
| 10 | Pulang-pergi | Date validation, selector, total, identity, reference |

## 3. Keterlacakan ke test otomatis

| File test | Fokus | Jumlah |
|---|---|---:|
| `tests/unit/leave.test.ts` | Domain cuti | 15 |
| `tests/unit/booking.test.ts` | Domain booking/date/reference | 12 |
| `tests/unit/profile.test.ts` | Completeness/validation gate | 17 |
| `tests/unit/flight.test.ts` | Filter/sort/time/cheapest | 10 |
| `tests/unit/leave-service.test.ts` | Overview/detail/history/quota | 7 |
| `tests/unit/booking-service.test.ts` | Booking/cancel/getter guards | 30 |
| `tests/unit/flight-service.test.ts` | Search relation/date/time | 8 |
| `tests/unit/member-service.test.ts` | Ticket validation/race/cancel | 9 |
| `tests/unit/itinerary-service.test.ts` | Itinerary rules/continuity | 15 |
| `tests/unit/travel-service.test.ts` | Visitors/outbox/bookings | 5 |
| `tests/unit/booking-actions.test.ts` | Booking/cancel actions | 9 |
| `tests/unit/member-actions.test.ts` | Profile/validation/itinerary actions | 14 |
| `tests/unit/travel-actions.test.ts` | Visitor booking action | 5 |
| `tests/unit/validation.test.ts` | Zod identity schema | 8 |
| `tests/e2e/authz.spec.ts` | Role matrix + anonymous | 6 |
| `tests/e2e/idor.spec.ts` | Ownership/IDOR dynamic routes | 4 |
| `tests/e2e/flights.spec.ts` | Cases 02, 03, 10 | 7 |
| `tests/e2e/hrd-leave.spec.ts` | Case 01 | 5 |
| `tests/e2e/member.spec.ts` | Cases 04, 05, 06 | 7 |
| `tests/e2e/mobile.spec.ts` | Responsif 390px | 6 |
| `tests/e2e/smoke.spec.ts` | Auth/fondasi/seed | 7 |
| `tests/e2e/travel.spec.ts` | Cases 07, 08, 09 | 6 |

> Jumlah pada tabel adalah jumlah test efektif; baris `it.each` dihitung per kasus.
> Total yang dilaporkan Vitest adalah **165 test**. E2E total **48 test**.

## 4. Keterlacakan ke diagram konseptual

Setiap studi kasus memiliki pasangan use case, robustness, dan sequence diagram di
`docs/diagram/`. Implementasi mengikuti aktor, entitas, dan alur utama diagram; detail
tambahan (auth, session, email outbox, ticket validation) dijelaskan di
[`pemetaan-diagram.md`](pemetaan-diagram.md).

## 5. Catatan gap

| Gap | Dampak | Status |
|---|---|---|
| Halaman RSC tidak diukur coverage | Business logic halaman bisa berubah tanpa unit test | Ditutup E2E untuk happy path + authz |
| Tabel HRD/member masih scroll di mobile | UX kurang nyaman | Known limitation |
| E2E shared DB/serial | Tidak aman untuk parallel/sharding | Known limitation |
| Usability simulasi | Tidak dapat digeneralisasi | Diberi disclaimer |
| Email/payment simulasi | Tidak menguji integrasi nyata | Known limitation |
