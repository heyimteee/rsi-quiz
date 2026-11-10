# 04 — Usability Testing (Simulasi)

> **DISCLAIMER:** Penelitian ini adalah **simulasi** untuk memenuhi kebutuhan dokumentasi
> tugas. Tidak ada partisipan manusia nyata yang dilibatkan. Data, profil responden, waktu,
> dan skor SUS di bawah ini dihasilkan untuk demonstrasi akademik dan **tidak boleh**
> dipresentasikan sebagai hasil penelitian pengguna sesungguhnya.

## 1. Tujuan

1. Menilai kemudahan penggunaan alur utama 10 studi kasus.
2. Mengidentifikasi hambatan pada tugas representatif: cuti, pencarian/pemesanan,
   perbandingan harga, validasi tiket, pemesanan pengunjung, dan pulang-pergi.
3. Mengukur kepuasan dengan System Usability Scale (SUS) dan Single Ease Question (SEQ).
4. Menyusun rekomendasi perbaikan berbasis temuan.

## 2. Metode

| Item | Keterangan |
|---|---|
| Jenis studi | Task-based usability testing, simulasi |
| Responden | 8 simulasi (R1–R8) |
| Tugas | 6 tugas per responden (48 observasi tugas) |
| Role-play | Responden berpindah akun demo untuk setiap peran; tabel profil adalah peran utama |
| Teknik | Think-aloud, pengukuran keberhasilan/waktu/error, SEQ, SUS |
| Perangkat | Desktop 1440×1000 dan seluler 390×844 (Chromium) |
| Akun | Akun demo per peran |
| Data | `docs/usability/data-sus-simulasi.csv`, `data-tugas-simulasi.csv` |
| Skrip hitung | `node scripts/hitung-usability.mjs --write` |

### Profil responden simulasi (peran utama)

| ID | Peran utama simulasi | Pengalaman |
|---|---|---|
| R1 | Manajer HRD | Familiar dengan aplikasi HR |
| R2 | Calon Penumpang | Familiar dengan aplikasi travel |
| R3 | Calon Penumpang | Familiar dengan aplikasi travel |
| R4 | Member Frequent Traveller | Familiar dengan aplikasi travel |
| R5 | Member Frequent Traveller | Familiar dengan aplikasi travel |
| R6 | Manajer Travel | Familiar dengan back-office travel |
| R7 | Manajer Travel | Familiar dengan back-office travel |
| R8 | Pengunjung | Familiar dengan e-tiket |

## 3. Tugas

| ID | Tugas | Peran | Kriteria berhasil |
|---|---|---|---|
| T1 | Menyaring cuti bulanan + memeriksa sisa hak cuti | HRD | Daftar dan sisa cuti terbaca |
| T2 | Cari → pesan → batalkan tiket | Penumpang | Booking dan pembatalan berhasil |
| T3 | Filter jam → bandingkan → pesan | Member | Perbandingan dan booking berhasil |
| T4 | Lengkapi profil → validasi tiket | Member | Validasi berhasil atau pesan penolakan dipahami |
| T5 | Filter status → pesan pengunjung → verifikasi kode | Travel | Status, booking, verifikasi berhasil |
| T6 | Error tanggal pulang → ulangi valid → booking | Penumpang | Error dipahami dan booking berhasil |

Detail: [`usability/skenario-tugas.md`](usability/skenario-tugas.md).

## 4. Hasil metrik tugas

Data lengkap: [`usability/hasil-simulasi.md`](usability/hasil-simulasi.md).

| ID | Success rate | Waktu rata-rata | Error rata-rata | SEQ |
|---|---:|---:|---:|---:|
| T1 | 100,00% | 103,75 detik | 0,38 | 6,38 |
| T2 | 100,00% | 159,38 detik | 1,25 | 5,50 |
| T3 | 100,00% | 123,75 detik | 0,63 | 5,63 |
| T4 | 87,50% | 139,38 detik | 0,63 | 5,25 |
| T5 | 87,50% | 177,50 detik | 1,38 | 5,38 |
| T6 | 87,50% | 132,50 detik | 1,50 | 5,00 |
| **Agregat** | **93,75%** | **139,38 detik** | **0,96** | **5,52** |

Interpretasi:
- Success rate 93,75% menunjukkan alur utama dapat diselesaikan.
- T5 (pemesanan pengunjung + verifikasi) memiliki waktu tertinggi (177,50 detik) — kandidat
  utama perbaikan navigasi/istilah.
- T6 memiliki error tertinggi (1,50) dan SEQ terendah (5,00), mengindikasikan kebutuhan
  memperjelas konteks error tanggal.
- T4 memiliki satu kegagalan simulasi (87,5%) karena responden bingung membedakan profil
  lengkap vs validasi tiket.

## 5. Hasil SUS

Data mentah: [`usability/data-sus-simulasi.csv`](usability/data-sus-simulasi.csv).

| Responden | Peran | Skor SUS |
|---|---|---:|
| R1 | Manajer HRD | 92,50 |
| R2 | Calon Penumpang | 87,50 |
| R3 | Calon Penumpang | 87,50 |
| R4 | Member Frequent Traveller | 87,50 |
| R5 | Member Frequent Traveller | 92,50 |
| R6 | Manajer Travel | 85,00 |
| R7 | Manajer Travel | 95,00 |
| R8 | Pengunjung | 85,00 |
| **Rata-rata** | | **89,06** |
| **Simpangan baku** | | **3,52** |

Interpretasi: rata-rata 89,06 berada di atas ambang 80,3 (Bangor et al.) sehingga secara
simulasi tergolong **excellent / grade A**. Karena data simulasi dan responden diasumsikan
familiar, hasil ini **tidak dapat digeneralisasi**. Untuk studi nyata, target minimal 12–20
responden dan analisis demografis diperlukan.

## 6. Temuan dan rekomendasi

### Temuan 1 — Istilah status berbahasa Inggris

**Observasi simulasi:** 2 dari 8 responden ragu membedakan `Booked`, `Confirmed`, dan
`Waiting for Payment` karena UI lain berbahasa Indonesia.

**Rekomendasi:** pertahankan istilah status sesuai requirement, tetapi tambahkan padanan
Indonesia di bawah badge atau tooltip:
- Confirmed → “Terkonfirmasi”
- Booked → “Dipesan”
- Waiting for Payment → “Menunggu pembayaran”

**Prioritas:** Sedang.

### Temuan 2 — Tabel lebar pada layar kecil

**Observasi simulasi:** halaman HRD dan tabel perbandingan member memerlukan geser
horizontal di 390px. Halaman travel sudah memakai kartu dan jauh lebih nyaman.

**Rekomendasi:** terapkan pola kartu seluler pada daftar cuti HRD dan tabel perbandingan
member; pertahankan tabel desktop untuk data lengkap.

**Prioritas:** Tinggi untuk mobile.

### Temuan 3 — Umpan balik validasi tiket

**Observasi simulasi:** 1 responden bingung setelah memilih tiket lain karena pesan hasil
validasi sebelumnya masih terlihat. (Perbaikan sudah diterapkan: hasil disembunyikan saat
pilihan berubah.)

**Rekomendasi:** pertahankan reset pesan saat pilihan berubah dan tampilkan ringkasan
status tiket setelah validasi.

**Prioritas:** Sedang.

### Temuan 4 — Lokasi email e-tiket

**Observasi simulasi:** 2 responden mencari email di halaman konfirmasi dan tidak langsung
menemukan tautan ke kotak email simulasi.

**Rekomendasi:** tambahkan tautan “Lihat email e-tiket” pada halaman konfirmasi pemesanan
penumpang (halaman travel sudah memilikinya).

**Prioritas:** Rendah–sedang.

### Temuan 5 — Pesan error tanggal pulang jelas

**Observasi simulasi:** 6 dari 8 responden memahami pesan
“Tanggal kepulangan tidak boleh lebih awal daripada tanggal keberangkatan” tanpa bantuan.

**Rekomendasi:** pertahankan pesan persis; tambahkan contoh tanggal valid di bawah field
jika diperlukan.

**Prioritas:** Rendah (sudah baik).

### Temuan 6 — Checklist profil membantu

**Observasi simulasi:** checklist data wajib di halaman profil dan validasi membantu
responden mengetahui field yang kurang.

**Rekomendasi:** pertahankan; tambahkan pintasan dari pesan penolakan ke field yang kurang.

**Prioritas:** Rendah.

## 7. Rekomendasi prioritas

| Prioritas | Rekomendasi | Dampak |
|---|---|---|
| P1 | Kartu seluler untuk daftar cuti HRD dan perbandingan member | Kenyamanan mobile |
| P1 | Padanan Indonesia untuk status booking | Kejelasan istilah |
| P2 | Tautan email e-tiket di konfirmasi penumpang | Menemukan e-tiket |
| P2 | Reset/ringkasan status setelah validasi tiket | Umpan balik |
| P3 | Contoh tanggal valid pada form pulang-pergi | Pencegahan error |
| P3 | Pintasan field kurang dari pesan validasi | Efisiensi |

## 8. Keterbatasan dan etika

- **Data simulasi**, bukan partisipan nyata; tidak ada consent, demografi nyata, atau
  perekaman sesi.
- Jumlah responden simulasi kecil (8) dan diasumsikan familiar dengan aplikasi.
- Tidak ada pengujian dengan pembaca layar, pengukuran waktu nyata, atau analisis statistik
  inferensial.
- Jika studi nyata dilakukan: gunakan lembar persetujuan, anonymisasi, hak withdraw,
  kompensasi yang wajar, dan simpan data secara aman.
- Hasil usability tidak boleh dijadikan klaim “aplikasi terbukti usable” tanpa replikasi
  dengan pengguna nyata.
