# 02 — Blackbox Testing

Dokumen ini memuat kasus uji blackbox untuk 10 studi kasus, matriks otorisasi, skenario IDOR,
tabel transisi status, verifikasi pesan error, dan defect log.

**Legenda metode bukti**

| Kode | Arti |
|---|---|
| `[A]` | Otomatis E2E Playwright |
| `[U]` | Otomatis unit/integration Vitest |
| `[M]` | Verifikasi manual melalui browser; bukti di `evidence/manual-verification.md` |
| `[D]` | Diuji pada level domain/service (unit) |

Semua kasus di bawah berstatus **Lulus** pada eksekusi 6–10 November 2026, kecuali yang
dinyatakan sebagai batasan yang diketahui.

---

## 1. Studi Kasus 01 — Pengajuan dan Riwayat Cuti (HRD)

| ID | Input / Langkah | Hasil yang Diharapkan | Hasil Aktual | Metode |
|---|---|---|---|---|
| BB-01-01 | Login HRD → `/hrd/cuti` bulan berjalan | Daftar pengajuan yang beririsan dengan bulan berjalan; jumlah sesuai seed | 8 baris (9 pada Jan–Mar/Desember sesuai seed) | `[A]` |
| BB-01-02 | Pilih tanggal 1 pada bulan berjalan | Hanya pengajuan yang mencakup tanggal tersebut | 1 baris (Gilang Ramadhan), Bunga tidak muncul | `[A]` |
| BB-01-03 | Pilih tahun tanpa data (current-2) | Empty state “Tidak ada pengajuan cuti” | Tampil empty state | `[A]` |
| BB-01-04 | Buka detail pengajuan pertama | Nama, periode, durasi, status, alasan, dan hak cuti tampil benar | 2 hari, status Disetujui, kuota 12/terpakai 6/sisa 6 | `[A]` |
| BB-01-05 | Buka riwayat pegawai dari detail | Riwayat semua tahun + sisa tahun berjalan | Riwayat dan kartu sisa tampil | `[A]` |
| BB-01-06 | Riwayat pegawai dengan cuti lintas tahun | Durasi total 7 hari, pembagian 4 hari tahun berjalan + 3 hari tahun berikutnya | “2026: 4 hari · 2027: 3 hari” | `[A]` |
| BB-01-07 | URL `?bulan=2&tahun=2026&tanggal=31` | Peringatan tanggal tidak valid; filter jatuh ke seluruh bulan | Peringatan tampil, tidak error | `[M]` |
| BB-01-08 | Pengajuan 30 Jan–3 Feb dilihat pada Februari | Pengajuan muncul karena rentang beririsan | Lulus (domain overlap) | `[D]` |
| BB-01-09 | URL bulan 13 / `tanggal=31` pada Februari | Nilai tidak valid ditolak/di-fallback tanpa crash | Lulus (validasi periode) | `[D]` |

**Acceptance criteria:** a) memilih periode semua pegawai; b) melihat pengajuan masing-masing;
c) melihat riwayat masing-masing. **Terpenuhi.**

---

## 2. Studi Kasus 02 — Cari, Pesan, Batalkan Tiket

| ID | Input / Langkah | Hasil yang Diharapkan | Hasil Aktual | Metode |
|---|---|---|---|---|
| BB-02-01 | Cari CGK→DPS tanggal besok | Hasil berisi maskapai, jadwal, harga, kursi | 3 penerbangan tampil | `[A]` |
| BB-02-02 | Buka detail penerbangan | Rute, jam, durasi, harga, fasilitas tampil | Detail tampil | `[A]` |
| BB-02-03 | Isi identitas valid → pesan | Booking `CONFIRMED`, kode `TRV-XXXXXX`, tiket & email dibuat | Redirect konfirmasi, kode valid | `[A]` |
| BB-02-04 | Batalkan booking dari detail | Status `CANCELLED`, kursi kembali, tombol batal hilang | Alert sukses, status Cancelled | `[A]` |
| BB-02-05 | Cari penerbangan yang sudah lewat | Penerbangan lewat tidak muncul sebagai hasil aktif | Filter `departureAt >= now` | `[U]` |
| BB-02-06 | Cari rute tanpa jadwal | Empty state, bukan error | Empty state tampil | `[M]` |
| BB-02-07 | Profil belum lengkap saat booking | Booking ditolak dengan pesan yang sesuai | `Data profil tidak lengkap` | `[U]` |
| BB-02-08 | NIK 3 digit / telepon 3 digit | Validasi field gagal; tidak ada booking | Pesan field muncul | `[U]` |
| BB-02-09 | Batalkan booking milik orang lain | Ditolak; data tidak berubah | Error `FORBIDDEN` | `[U]` |
| BB-02-10 | Batalkan dua kali / jadwal lewat | Ditolak, kursi tidak bertambah dua kali | `ALREADY_CANCELLED` / `CANCEL_NOT_ALLOWED` | `[U]` |

**Acceptance criteria:** a) cari sesuai tujuan; b) lihat harga tiap maskapai; c) pesan sesuai
preferensi. **Terpenuhi.**

---

## 3. Studi Kasus 03 — Perbandingan Dua Tujuan

| ID | Input / Langkah | Hasil yang Diharapkan | Hasil Aktual | Metode |
|---|---|---|---|---|
| BB-03-01 | CGK→DPS vs CGK→SUB tanggal besok | Dua kolom berisi jadwal, maskapai, harga, termurah/tercepat | 2 kolom, 6 kartu, banner selisih | `[A]` |
| BB-03-02 | Tujuan 1 = tujuan 2 | Ditolak dengan pesan dua tujuan harus berbeda | Pesan tampil, grid tidak dirender | `[A]` |
| BB-03-03 | Asal = salah satu tujuan | Ditolak | Lulus | `[U]` |
| BB-03-04 | Salah satu tujuan tanpa penerbangan | Kolom kosong dengan empty state, kolom lain tetap tampil | Lulus | `[M]` |
| BB-03-05 | Harga termurah sama di kedua tujuan | Tidak menampilkan klaim “lebih murah” yang salah | Banner hanya muncul bila selisih > 0 (inspeksi kode) | `[M]` |
| BB-03-06 | Kursi habis pada salah satu hasil | Tidak dianggap termurah; CTA tidak aktif | Lulus (sold-out difilter) | `[U]` |

**Acceptance criteria:** a) cari beberapa tujuan; b) lihat jadwal, maskapai, harga.
**Terpenuhi.**

---

## 4. Studi Kasus 04 — Multi-Destinasi (Member)

| ID | Input / Langkah | Hasil yang Diharapkan | Hasil Aktual | Metode |
|---|---|---|---|---|
| BB-04-01 | Buat rencana 2 rute | Rencana tersimpan, redirect detail, 2 segmen | 2 segmen tampil | `[A]` |
| BB-04-02 | Tambah rute lanjutan | Segmen ke-3 ditambahkan, tanggal berurutan | 3 segmen, alert sukses | `[A]` |
| BB-04-03 | Cari dari rencana tersimpan | Hasil per segmen + total termurah | 2 hasil segmen, total termurah tampil | `[A]` |
| BB-04-04 | Cari manual 2 segmen | Dua blok hasil, masing-masing punya jadwal/harga | 2 segmen tampil | `[A]` |
| BB-04-05 | Buat 5 rute | Ditolak “maksimal 4 rute” | Ditolak sebelum service | `[U]` |
| BB-04-06 | Rute tidak tersambung (CGK→DPS lalu SUB→CGK) | Ditolak karena kota asal ≠ tujuan sebelumnya | `INVALID_CONTINUITY` | `[U]` |
| BB-04-07 | Tanggal rute mundur / masa lalu | Ditolak | `INVALID_DATE` | `[U]` |
| BB-04-08 | Member lain membuka rencana | 404, data tidak bocor | Halaman tidak ditemukan | `[A]` |
| BB-04-09 | Segmen tanpa penerbangan | Blok kosong dengan pesan, total tidak dihitung | Lulus | `[M]` |

**Acceptance criteria:** member dapat mencari multi-destinasi berdasarkan tanggal, lokasi
keberangkatan, dan tujuan. **Terpenuhi.**

---

## 5. Studi Kasus 05 — Profil dan Validasi Tiket

| ID | Input / Langkah | Hasil yang Diharapkan | Hasil Aktual | Metode |
|---|---|---|---|---|
| BB-05-01 | Member lengkap buka profil | Semua data wajib lengkap | Checklist hijau | `[A]` |
| BB-05-02 | Ubah nama/telepon lalu simpan | Data tersimpan, konfirmasi tampil, header ikut berubah | Sukses | `[A]` |
| BB-05-03 | Member2 buka validasi | Peringatan data belum lengkap (NIK, tanggal lahir) | Peringatan tampil | `[A]` |
| BB-05-04 | Member2 klik validasi | Ditolak dengan pesan persis `Data profil tidak lengkap` | Pesan persis + daftar field | `[A]` |
| BB-05-05 | Lengkapi profil member2 lalu validasi | Validasi berhasil, riwayat bertambah | `Validasi berhasil` | `[A]` |
| BB-05-06 | Validasi tiket yang sudah dibatalkan | Ditolak | `TICKET_CANCELLED` | `[U]` |
| BB-05-07 | Validasi tiket yang sudah valid | Idempoten, tidak membuat duplikat | `alreadyValid` | `[U]` |
| BB-05-08 | Member lain memvalidasi tiket orang lain | Ditolak / tidak ditemukan | `TICKET_NOT_FOUND` | `[U]` |
| BB-05-09 | Tanggal lahir masa depan / NIK bukan 16 digit | Ditolak saat simpan | Pesan field | `[U]` |

**Acceptance criteria:** a) update profil; b) validasi tiket memakai profil. **Terpenuhi.**

---

## 6. Studi Kasus 06 — Preferensi, Perbandingan, Pemesanan (Member)

| ID | Input / Langkah | Hasil yang Diharapkan | Hasil Aktual | Metode |
|---|---|---|---|---|
| BB-06-01 | Cari CGK→DPS tanggal besok | Daftar penerbangan + ringkasan harga | Daftar tampil (3 baris pada screenshot) | `[M]` |
| BB-06-02 | Filter jam 12:00–23:59 | Hanya penerbangan sore/malam | 1 hasil (18:40) pada data unit | `[U]` |
| BB-06-03 | Urutkan harga terendah/tertinggi/durasi | Urutan berubah sesuai kriteria | Lulus | `[U]` |
| BB-06-04 | Baca tabel perbandingan | Termurah ditandai; selisih tampil | “Termurah” dan delta `+Rp…` tampil | `[A]` |
| BB-06-05 | Pesan dari tabel | Masuk detail, booking sukses | Booking `CONFIRMED` | `[A]` |
| BB-06-06 | Tanggal tanpa jadwal | Empty state | Lulus | `[M]` |
| BB-06-07 | Kursi habis | Harga dicoret, CTA tidak aktif | Lulus | `[M]` |
| BB-06-08 | Passenger membuka `/member/*` | Ditolak | `/unauthorized` | `[A]` |

**Acceptance criteria:** a) lihat penerbangan sesuai preferensi; b) bandingkan harga;
c) pesan tiket. **Terpenuhi.**

---

## 7. Studi Kasus 07 — Status Pemesanan (Manajer Travel)

| ID | Input / Langkah | Hasil yang Diharapkan | Hasil Aktual | Metode |
|---|---|---|---|---|
| BB-07-01 | Buka menu status | Semua pemesanan + ringkasan status | 10 baris seed | `[A]` |
| BB-07-02 | Filter Waiting for Payment | Hanya status tersebut | 1 baris (`TRV-DEMO02`) | `[A]` |
| BB-07-03 | Filter Confirmed/Booked/Cancelled | Hanya status yang dipilih | Semua baris sesuai label | `[A]` |
| BB-07-04 | Cari `TRV-DEMO05` | Satu baris | 1 baris | `[A]` |
| BB-07-05 | Cari kode acak | Empty state + reset | Lulus | `[M]` |
| BB-07-06 | Pemesanan pulang-pergi di daftar | Rute keberangkatan + info pulang | Tampil “Pulang: DPS → CGK” | `[M]` |
| BB-07-07 | Layar 390px | Kartu pemesanan tampil, tabel lebar disembunyikan | Kartu tampil, tanpa overflow | `[A]` |
| BB-07-08 | Peran non-travel membuka halaman | Ditolak | `/unauthorized` | `[A]` |

**Acceptance criteria:** melihat semua status dan memfilter status tertentu. **Terpenuhi.**

---

## 8. Studi Kasus 08 — Pemesanan untuk Pengunjung

| ID | Input / Langkah | Hasil yang Diharapkan | Hasil Aktual | Metode |
|---|---|---|---|---|
| BB-08-01 | Travel cari CGK→DPS besok | Hasil penerbangan tampil | 3 kartu | `[A]` |
| BB-08-02 | Tanggal tanpa jadwal | Empty state | Lulus | `[M]` |
| BB-08-03 | Buka form pesan | Daftar pengunjung + identitas ter-mask | Form tampil | `[A]` |
| BB-08-04 | Pilih pengunjung → pesan | Booking atas nama pengunjung, booker = manajer | `TRV-...` terbit | `[A]` |
| BB-08-05 | Login pengunjung → Tiket Saya | Tiket baru terlihat | Referensi tampil | `[A]` |
| BB-08-06 | Buka Email Outbox | Email ke pengunjung berisi referensi | Email tampil | `[A]` |
| BB-08-07 | Pengunjung lain membuka tiket | 404 | Tidak ditemukan | `[A]` |
| BB-08-08 | Lihat source halaman form | NIK penuh tidak ada di payload | Hanya NIK ter-mask | `[A]` |
| BB-08-09 | Non-travel membuka `/dev/email` | Ditolak | `/unauthorized` | `[A]` |

**Acceptance criteria:** a) cari tiket; b) pesan dengan data pengunjung; c) pengunjung melihat
tiket; d) email e-tiket diterima. **Terpenuhi** (email disimulasikan).

---

## 9. Studi Kasus 09 — Verifikasi Kode Booking

| ID | Input / Langkah | Hasil yang Diharapkan | Hasil Aktual | Metode |
|---|---|---|---|---|
| BB-09-01 | Input `TRV-SALAH` | Pesan persis `Kode booking reference tidak sesuai` | Pesan tampil | `[A]` |
| BB-09-02 | Input hanya spasi | Pesan tidak sesuai | Pesan tampil | `[A]` |
| BB-09-03 | Input ` trv-demo01 ` | Normalisasi, kode ditemukan | Status tampil | `[A]` |
| BB-09-04 | Kode valid `TRV-DEMO01` | Status Confirmed, rute, total | Status, rute CGK–DPS, dan total tampil | `[A]` |
| BB-09-05 | Kode pemesanan batal (`TRV-DEMO04`) | Status Cancelled dengan banner netral | Lulus | `[M]` |
| BB-09-06 | Ganti dari kode salah ke kode benar | Error hilang, hasil muncul | Lulus | `[A]` |
| BB-09-07 | Non-travel membuka halaman | Ditolak | `/unauthorized` | `[A]` |

**Acceptance criteria:** a) otorisasi tiket; b) lihat status booking. **Terpenuhi.**

---

## 10. Studi Kasus 10 — Pulang-Pergi

| ID | Input / Langkah | Hasil yang Diharapkan | Hasil Aktual | Metode |
|---|---|---|---|---|
| BB-10-01 | Isi asal, tujuan, tanggal berangkat/pulang | Daftar keberangkatan dan kepulangan | 3 + 3 opsi | `[A]` |
| BB-10-02 | Tanggal pulang < berangkat | Pesan persis tanggal kepulangan tidak boleh lebih awal | Pesan tampil | `[A]` |
| BB-10-03 | Rute tanpa penerbangan | `Penerbangan tidak tersedia untuk kriteria yang dipilih` | Pesan tampil | `[A]` |
| BB-10-04 | Pilih satu keberangkatan + satu kepulangan | Total tampil, tombol lanjut aktif | Total `Rp…` tampil; kesetaraan harga diuji unit | `[A]` |
| BB-10-05 | Isi identitas → konfirmasi | Booking 2 segmen, referensi tampil | 2 segmen | `[A]` |
| BB-10-06 | Tanggal pulang sama dengan berangkat | Diizinkan | Lulus | `[U]` |
| BB-10-07 | Rute kepulangan tidak terbalik | Ditolak | `INVALID_ROUTE` | `[U]` |
| BB-10-08 | Kursi habis pada salah satu leg | Opsi tidak dapat dipilih | Lulus | `[M]` |

**Acceptance criteria a–h:** **Terpenuhi.**

---

## 11. Matriks Otorisasi

Ringkasan hasil `tests/e2e/authz.spec.ts` (**5 peran × 18 rute statis**) dan `idor.spec.ts`:

| Rute | HRD | Penumpang | Member | Travel | Pengunjung |
|---|:---:|:---:|:---:|:---:|:---:|
| `/hrd/cuti` | ✅ | ❌ | ❌ | ❌ | ❌ |
| `/hrd/pegawai` | ✅ | ❌ | ❌ | ❌ | ❌ |
| `/member/profil` | ❌ | ❌ | ✅ | ❌ | ❌ |
| `/member/validasi` | ❌ | ❌ | ✅ | ❌ | ❌ |
| `/member/penerbangan` | ❌ | ❌ | ✅ | ❌ | ❌ |
| `/member/rencana` | ❌ | ❌ | ✅ | ❌ | ❌ |
| `/member/rencana/baru` | ❌ | ❌ | ✅ | ❌ | ❌ |
| `/member/pencarian-multi` | ❌ | ❌ | ✅ | ❌ | ❌ |
| `/travel/pemesanan` | ❌ | ❌ | ❌ | ✅ | ❌ |
| `/travel/cari` | ❌ | ❌ | ❌ | ✅ | ❌ |
| `/travel/verifikasi` | ❌ | ❌ | ❌ | ✅ | ❌ |
| `/dev/email` | ❌ | ❌ | ❌ | ✅ | ❌ |
| `/tiket-saya` | ❌ | ❌ | ❌ | ❌ | ✅ |
| `/penerbangan` | ❌ | ✅ | ✅ | ❌ | ❌ |
| `/penerbangan/bandingkan` | ❌ | ✅ | ✅ | ❌ | ❌ |
| `/pulang-pergi` | ❌ | ✅ | ✅ | ❌ | ❌ |
| `/pulang-pergi/penumpang` | ❌ | ✅ | ✅ | ❌ | ❌ |
| `/pemesanan` | ❌ | ✅ | ✅ | ❌ | ✅ |

IDOR yang diuji:

| Skenario | Hasil |
|---|---|
| Penumpang membuka detail booking penumpang lain | 404 |
| Member membuka rencana member lain | 404 |
| Pengunjung membuka tiket pengunjung lain | 404 |
| Pengunjung membuka detail penerbangan | `/unauthorized` |
| Anonymous membuka rute terproteksi | redirect `/login` |

---

## 12. Tabel Transisi Status

| Entitas | Dari | Aksi | Ke | Validasi |
|---|---|---|---|---|
| Booking | `WAITING_FOR_PAYMENT` / `BOOKED` / `CONFIRMED` | Batalkan | `CANCELLED` | Pemilik, belum batal, belum berangkat |
| Booking | `CONFIRMED` | Validasi tiket | Tiket `VALID` | Profil lengkap, pemilik tiket |
| Booking | `CONFIRMED` | Validasi tiket (profil kurang) | Tiket `REJECTED` | Pesan `Data profil tidak lengkap` |
| Booking | `CANCELLED` | Validasi tiket | Ditolak | `TICKET_CANCELLED` |
| Profil | Tidak lengkap | Lengkapi + simpan | Lengkap | NIK 16 digit, telepon 9–15, tanggal lahir valid |
| Kursi | Tersedia | Booking | Berkurang 1/segmen | Transaksi + `updateMany` bersyarat |
| Kursi | Terpakai | Pembatalan | Bertambah 1/segmen | Transaksi atomik |

---

## 13. Verifikasi Pesan Error Persis

| Pesan | Lokasi | Bukti |
|---|---|---|
| `Data profil tidak lengkap` | Validasi tiket | `[A]` member2 |
| `Kode booking reference tidak sesuai` | Verifikasi booking | `[A]` |
| `Tanggal kepulangan tidak boleh lebih awal daripada tanggal keberangkatan` | Pulang-pergi | `[A]` |
| `Penerbangan tidak tersedia untuk kriteria yang dipilih` | Pulang-pergi | `[A]` |

---

## 14. Defect Log

| ID | Defect | Severity | Status | Perbaikan |
|---|---|---|---|---|
| D-01 | Penerbangan yang sudah lewat tampil sebagai hasil aktif | P1 | Selesai | Filter `departureAt >= now` untuk hari ini |
| D-02 | Pembatalan tidak atomik (race kursi) | P1 | Selesai | `updateMany` bersyarat di dalam transaksi |
| D-03 | Passport terhapus saat booking | P1 | Selesai | Field opsional tidak ditimpa jika tidak dikirim |
| D-04 | Tiket batal masih dapat divalidasi | P1 | Selesai | Cek status booking + filter tiket aktif |
| D-05 | NIK penuh terekspos di payload form pengunjung | P2 | Selesai | Kirim NIK ter-mask ke client |
| D-06 | Rencana perjalanan > 4 rute / tidak tersambung | P2 | Selesai | Validasi service + action |
| D-07 | Tabel travel tidak nyaman di 390px | P2 | Selesai | Kartu seluler |
| D-08 | Pesan seed tidak persis | P2 | Selesai | Gunakan `Data profil tidak lengkap` |
| D-09 | Test tanggal tetap akan kedaluwarsa | P2 | Selesai | Kasus sensitif tanggal memakai tanggal dinamis; fixture max-route tetap aman karena short-circuit |
| D-10 | Matriks otorisasi belum lengkap | P1 | Selesai | 18 rute statis + 4 IDOR |

Tidak ada defect P0/P1 yang terbuka pada akhir Sprint 8.

---

## 15. Batasan yang Diketahui

1. Email dan pembayaran disimulasikan; tidak ada SMTP/payment gateway.
2. E2E dijalankan serial dan memakai satu database; test yang membuat data tidak diisolasi
   per test (risiko jika dijalankan paralel/retry).
3. Coverage mengukur modul inti, bukan seluruh halaman RSC.
4. Tabel HRD dan tabel perbandingan member masih dapat digeser horizontal pada layar kecil.
5. Usability menggunakan data simulasi, bukan responden nyata.
6. Pengujian hanya pada Chromium; Firefox/WebKit dan pengujian beban tidak dilakukan.
