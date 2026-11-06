# Pemetaan Diagram Konseptual ke Implementasi

Diagram sumber diekstrak dari `docs/source/diagram-konseptual.zip` ke `docs/diagram/`.
Setiap studi kasus memiliki tiga diagram: use case, robustness, dan sequence.

| # | Studi kasus | Use case | Robustness | Sequence |
|---|---|---|---|---|
| 01 | Cuti HRD | [Use case](diagram/01-cuti-hrd/01_usecase_cuti-hrd.png) | [Robustness](diagram/01-cuti-hrd/01_robustness_cuti-hrd.png) | [Sequence](diagram/01-cuti-hrd/01_sequence_cuti-hrd.png) |
| 02 | Tiket: cari, pesan, batal | [Use case](diagram/02-tiket-pesan-batal/02_usecase_tiket-pesan-batal.png) | [Robustness](diagram/02-tiket-pesan-batal/02_robustness_tiket-pesan-batal.png) | [Sequence](diagram/02-tiket-pesan-batal/02_sequence_tiket-pesan-batal.png) |
| 03 | Bandingkan dua tujuan | [Use case](diagram/03-cari-banding-tujuan/03_usecase_cari-banding-tujuan.png) | [Robustness](diagram/03-cari-banding-tujuan/03_robustness_cari-banding-tujuan.png) | [Sequence](diagram/03-cari-banding-tujuan/03_sequence_cari-banding-tujuan.png) |
| 04 | Multi-destinasi | [Use case](diagram/04-multi-destinasi/04_usecase_multi-destinasi.png) | [Robustness](diagram/04-multi-destinasi/04_robustness_multi-destinasi.png) | [Sequence](diagram/04-multi-destinasi/04_sequence_multi-destinasi.png) |
| 05 | Profil & validasi | [Use case](diagram/05-profil-validasi/05_usecase_profil-validasi.png) | [Robustness](diagram/05-profil-validasi/05_robustness_profil-validasi.png) | [Sequence](diagram/05-profil-validasi/05_sequence_profil-validasi.png) |
| 06 | Member: cari, banding, pesan | [Use case](diagram/06-member-cari-banding-pesan/06_usecase_member-cari-banding-pesan.png) | [Robustness](diagram/06-member-cari-banding-pesan/06_robustness_member-cari-banding-pesan.png) | [Sequence](diagram/06-member-cari-banding-pesan/06_sequence_member-cari-banding-pesan.png) |
| 07 | Status booking | [Use case](diagram/07-status-booking/07_usecase_status-booking.png) | [Robustness](diagram/07-status-booking/07_robustness_status-booking.png) | [Sequence](diagram/07-status-booking/07_sequence_status-booking.png) |
| 08 | Pesan untuk pengunjung | [Use case](diagram/08-pesan-untuk-pengunjung/08_usecase_pesan-untuk-pengunjung.png) | [Robustness](diagram/08-pesan-untuk-pengunjung/08_robustness_pesan-untuk-pengunjung.png) | [Sequence](diagram/08-pesan-untuk-pengunjung/08_sequence_pesan-untuk-pengunjung.png) |
| 09 | Otorisasi booking | [Use case](diagram/09-otorisasi-booking/09_usecase_otorisasi-booking.png) | [Robustness](diagram/09-otorisasi-booking/09_robustness_otorisasi-booking.png) | [Sequence](diagram/09-otorisasi-booking/09_sequence_otorisasi-booking.png) |
| 10 | Pulang-pergi | [Use case](diagram/10-pulang-pergi/10_usecase_pulang-pergi.png) | [Robustness](diagram/10-pulang-pergi/10_robustness_pulang-pergi.png) | [Sequence](diagram/10-pulang-pergi/10_sequence_pulang-pergi.png) |

## Pemetaan aktor

| Aktor diagram | Peran implementasi | Akun demo |
|---|---|---|
| Manajer HRD | `HRD_MANAGER` | `hrd@demo.test` |
| Calon Penumpang | `PASSENGER` | `penumpang@demo.test` |
| Pelanggan | `PASSENGER` | `pelanggan@demo.test` |
| Member Frequent Traveller | `MEMBER` | `member@demo.test`, `member2@demo.test` |
| Manajer Travel | `TRAVEL_MANAGER` | `travel@demo.test` |
| Pengunjung | `VISITOR` | `pengunjung@demo.test`, `budi.visitor@demo.test` |

## Pemetaan entitas

| Entitas diagram | Model Prisma | Catatan |
|---|---|---|
| Pegawai | `Employee` | Relasi opsional ke `User` |
| Pengajuan Cuti | `LeaveRequest` | Status `APPROVED/PENDING/REJECTED` |
| Riwayat Cuti | Query `LeaveRequest` per pegawai | Ditampilkan per tahun |
| Hak Cuti | `Employee.annualQuota` + perhitungan sisa | Dipotong per tahun kalender |
| Penerbangan | `Flight` | Relasi `Airport`, `Airline` |
| Maskapai | `Airline` | — |
| Tiket | `Ticket` | Satu per booking; status validasi |
| Pemesanan | `Booking` + `BookingSegment` | Round-trip memakai 2 segmen |
| Profil Member | `PassengerProfile` | Data wajib + paspor opsional |
| Data Pengunjung | `User` role `VISITOR` + `PassengerProfile` | Pemesanan atas nama pengunjung |
| Rute Perjalanan | `Itinerary` + `ItinerarySegment` | Maksimal 4 rute, harus tersambung |
| Status Pemesanan | `Booking.status` | Sesuai requirement |
| Email Terdaftar | `EmailOutbox` | Simulasi pengiriman e-tiket |

## Tambahan implementasi di luar diagram

- `User` + session JWT untuk autentikasi/otorisasi.
- `TicketValidation` untuk audit riwayat validasi.
- `EmailOutbox` untuk simulasi email.
- Validasi transaksi kursi dan referensi unik.
- Route guard per peran dan pengecekan kepemilikan (IDOR).
