# Log Verifikasi Manual

Kasus blackbox bertanda `[M]` diverifikasi langsung di browser pada build produksi
(`npm run build` + `npm run start`, port 3100) dengan database demo hasil seed. Tanggal
observasi: 6 November 2026 (screenshot) dan 10 November 2026 (pemeriksaan ulang teks/UI).
Screenshot pendukung ada di `docs/evidence/screenshots/`.

| Kasus | Input / Langkah | Hasil observasi | Bukti |
|---|---|---|---|
| BB-01-07 | URL `/hrd/cuti?bulan=2&tahun=2026&tanggal=31` | Peringatan “Tanggal tidak valid” dan filter jatuh ke seluruh bulan | Observasi langsung; tidak ada screenshot khusus |
| BB-02-06 | Cari rute tanpa jadwal | Empty state “Penerbangan tidak tersedia” | `05-flight-search.png` (varian hasil) |
| BB-03-04 | Bandingkan tujuan dengan satu sisi kosong | Satu kolom berisi empty state; kolom lain tetap tampil | Observasi langsung; `07-compare.png` adalah kasus kedua sisi terisi, bukan kasus ini |
| BB-03-05 | Harga termurah sama | Banner “lebih murah” hanya muncul bila selisih > 0 (inspeksi kode + UI) | Inspeksi kode; `07-compare.png` menunjukkan selisih positif, bukan kasus sama |
| BB-04-09 | Segmen itinerary tanpa penerbangan | Blok segmen menampilkan pesan tidak tersedia; total tidak dihitung | Observasi langsung; `14-member-multi.png` menunjukkan kedua segmen tersedia |
| BB-06-01 | Pencarian member default | Tabel berisi 3 penerbangan pada tanggal uji | `10-member-search.png` |
| BB-06-06 | Tanggal tanpa jadwal | Empty state pada halaman member | Observasi langsung |
| BB-06-07 | Kursi habis | Harga dicoret, label “Kursi habis”, CTA tidak aktif | Observasi langsung (data sold-out diuji unit) |
| BB-07-05 | Cari kode acak di daftar travel | Empty state + tombol reset | Observasi langsung |
| BB-07-06 | Baris pulang-pergi di daftar travel | Rute keberangkatan + baris “Pulang: … → …” | `15-travel-bookings.png` |
| BB-09-05 | Verifikasi `TRV-DEMO04` | Banner netral “pemesanan dibatalkan”, status Cancelled | Observasi langsung |
| BB-10-08 | Kursi habis pada salah satu leg | Opsi tidak dapat dipilih / CTA tidak tersedia | Observasi langsung; sold-out difilter unit |

Catatan: untuk kasus yang tidak memiliki screenshot khusus, hasil dicatat dari observasi
browser pada build produksi. Test otomatis terkait tetap menjadi bukti utama untuk logika
yang dapat diotomasi.
