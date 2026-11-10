# Skenario Tugas Usability (Simulasi)

Setiap responden simulasi menyelesaikan enam tugas berikut menggunakan akun demo yang
disediakan. Karena aplikasi memiliki banyak peran, responden melakukan **role-play**:
berpindah akun demo sesuai peran yang dibutuhkan tugas. Peran pada tabel profil responden
adalah peran utama, bukan satu-satunya peran yang dicoba. Waktu maksimum adalah batas untuk
menyatakan tugas gagal.

| ID | Peran | Tugas | Kriteria berhasil | Batas waktu |
|---|---|---|---|---:|
| T1 | Manajer HRD | Buka daftar cuti bulan berjalan, pilih satu pegawai, lalu periksa sisa hak cutinya. | Daftar cuti tampil, detail/riwayat pegawai terbuka, sisa cuti tahun berjalan terbaca. | 180 detik |
| T2 | Calon Penumpang | Cari penerbangan CGK–DPS besok, pilih satu penerbangan, pesan tiket, lalu batalkan. | Booking berhasil dengan kode referensi, lalu status berubah menjadi Cancelled. | 240 detik |
| T3 | Member | Cari penerbangan CGK–DPS dengan filter jam, bandingkan dua harga, lalu pesan salah satu. | Filter bekerja, tabel perbandingan terbaca, booking berhasil. | 210 detik |
| T4 | Member | Lengkapi data profil yang belum terisi, lalu validasi tiket. | Profil lengkap dan validasi berhasil; jika belum lengkap, pesan penolakan terbaca. | 240 detik |
| T5 | Manajer Travel | Filter pemesanan Waiting for Payment, pesan tiket untuk pengunjung, lalu verifikasi kode booking. | Filter menampilkan status yang benar, booking pengunjung berhasil, status kode tampil. | 270 detik |
| T6 | Calon Penumpang | Coba pulang-pergi dengan tanggal pulang sebelum berangkat, pahami pesan error, lalu ulangi dengan tanggal valid sampai mendapat kode referensi. | Pesan error dipahami, pemesanan valid berhasil, referensi tampil. | 240 detik |

## Data yang dicatat

- Keberhasilan tugas (`1` berhasil, `0` gagal).
- Waktu penyelesaian (detik).
- Jumlah error/percobaan salah.
- Single Ease Question (SEQ) 1–7 setelah tugas.
- Skor SUS setelah seluruh tugas.

Data: [`data-tugas-simulasi.csv`](data-tugas-simulasi.csv).

## Catatan simulasi

Data pada file CSV dihasilkan untuk demonstrasi akademik. Tidak ada partisipan manusia
nyata yang direkrut, tidak ada data pribadi, dan hasil tidak boleh digeneralisasi ke
pengguna sesungguhnya.
