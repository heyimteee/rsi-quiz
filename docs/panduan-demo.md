# Panduan Demo

Panduan singkat untuk mendemokan 10 studi kasus. Perkiraan total 8–12 menit.

## Persiapan

```bash
npm run db:reset
npm run dev
# buka http://localhost:3000
```

Semua kata sandi: `password123`. Login cepat tersedia di halaman masuk.

> Jika database sudah berisi data uji, jalankan `npm run db:reset` agar skenario deterministik.
> Email yang dikirim selama demo dapat dilihat di `/dev/email` (login Manajer Travel).

---

## 01 — Cuti HRD

**Akun:** `hrd@demo.test`

1. Login → otomatis ke `/hrd/cuti`.
2. Tunjukkan filter bulan/tahun dan opsional tanggal.
3. Buka detail salah satu pengajuan → tunjukkan durasi dan hak cuti.
4. Klik “Riwayat & Hak Cuti” → pilih pegawai → tunjukkan riwayat semua tahun,
   rekap per tahun, dan sisa tahun berjalan.
5. Contoh lintas tahun: cari **Fitri** → riwayat Desember–Januari menunjukkan pembagian
   4 hari + 3 hari.

**Poin:** filter memakai irisan rentang, bukan hanya tanggal mulai; durasi inklusif.

---

## 02 — Cari, Pesan, Batalkan Tiket

**Akun:** `penumpang@demo.test`

1. `/penerbangan` → pilih CGK–DPS, tanggal besok → cari.
2. Buka salah satu penerbangan → tunjukkan maskapai, jadwal, harga, kursi.
3. Isi form (sudah terisi dari profil) → pesan → tunjukkan kode booking dan e-tiket.
4. Buka “Pemesanan Saya” → detail → batalkan → status menjadi `Cancelled`.
5. (Opsional) tampilkan kursi sebelum/sesudah pembatalan di halaman detail.

**Poin:** kursi dikurangi/dikembalikan dalam transaksi; pembatalan memakai konfirmasi.

---

## 03 — Bandingkan Dua Tujuan

**Akun:** `penumpang@demo.test`

1. Menu “Bandingkan Tujuan”.
2. Isi asal CGK, tujuan DPS dan SUB, tanggal besok → bandingkan.
3. Tunjukkan dua kolom: jumlah penerbangan, termurah, tercepat, maskapai.
4. Tunjukkan banner tujuan yang lebih murah dan selisih harga.
5. Coba tujuan sama → pesan penolakan.

---

## 04 — Multi-Destinasi

**Akun:** `member@demo.test`

1. Menu “Rencana Perjalanan” → buka “Liburan Bali–Surabaya”.
2. Tunjukkan 2 rute; tambah rute lanjutan → 3 rute.
3. Klik “Cari penerbangan” → hasil per segmen + total termurah.
4. Alternatif: menu “Multi-Destinasi” → cari manual dua segmen.
5. Tunjukkan pencarian berdasarkan tanggal, asal, dan tujuan pada tiap segmen.

**Poin:** rute harus tersambung dan maksimal 4; tanggal berurutan.

---

## 05 — Profil dan Validasi Tiket

**Akun A (lengkap):** `member@demo.test`

1. Profil → tunjukkan checklist lengkap → validasi tiket → sukses.

**Akun B (belum lengkap):** `member2@demo.test`

1. Validasi Tiket → tunjukkan peringatan NIK/tanggal lahir kosong.
2. Klik “Validasi tiket” → muncul pesan persis **“Data profil tidak lengkap”**.
3. Buka Profil → isi NIK 16 digit dan tanggal lahir → simpan.
4. Kembali ke Validasi → validasi → sukses.

**Poin:** gate divalidasi di server; pesan error persis.

---

## 06 — Preferensi Member

**Akun:** `member@demo.test`

1. Menu “Cari & Bandingkan”.
2. Pilih tujuan/tanggal, isi jam dari–sampai, urutkan harga.
3. Tunjukkan tabel perbandingan: termurah, selisih, kursi, aksi.
4. Klik “Pesan” → form → konfirmasi booking.

---

## 07 — Status Pemesanan Travel

**Akun:** `travel@demo.test`

1. Login → `/travel/pemesanan`.
2. Tunjukkan ringkasan status dan tab `Semua`, `Confirmed`, `Booked`,
   `Waiting for Payment`, `Cancelled`.
3. Filter Waiting → satu baris `TRV-DEMO02`.
4. Cari kode booking → detail.
5. Kecilkan browser ke 390px → tunjukkan kartu seluler.

---

## 08 — Pesan untuk Pengunjung

**Akun:** `travel@demo.test`

1. “Pesan untuk Pengunjung” → cari CGK–DPS besok.
2. Pilih penerbangan → pilih pengunjung `pengunjung@demo.test`.
3. Pesan → konfirmasi berisi kode baru dan email tujuan.
4. Buka `/dev/email` → tunjukkan email e-tiket.
5. Logout → login `pengunjung@demo.test` → “Tiket Saya” → tiket baru terlihat.

**Poin:** booker = manajer, passenger = pengunjung; NIK di form hanya ter-mask.

---

## 09 — Verifikasi Kode Booking

**Akun:** `travel@demo.test`

1. “Verifikasi Booking”.
2. Input `TRV-SALAH` → pesan persis **“Kode booking reference tidak sesuai”**.
3. Input `trv-demo01` (huruf kecil + spasi) → status `Confirmed` tampil.
4. (Opsional) `TRV-DEMO04` → status `Cancelled` dengan banner netral.

**Poin:** input dinormalisasi; error tetap meminta input ulang.

---

## 10 — Pulang-Pergi

**Akun:** `penumpang@demo.test`

1. “Pulang-Pergi”.
2. Isi asal/tujuan, tanggal berangkat, dan tanggal pulang **lebih awal** → error persis.
3. Perbaiki tanggal → pilih satu keberangkatan dan satu kepulangan.
4. Lanjut → tunjukkan total harga dan data penumpang → konfirmasi.
5. Konfirmasi menampilkan 2 segmen dan kode referensi.

**Poin:** total = harga dua leg; rute kepulangan harus kebalikan; same-day diperbolehkan.

---

## Reset cepat setelah demo

```bash
npm run db:reset
```

Ini mengembalikan akun, cuti, penerbangan, booking seed, tiket, dan email outbox ke kondisi awal.
