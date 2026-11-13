DIAGRAM MASTER — 5 DIAGRAM UNTUK 10 STUDI KASUS
Tristant AI Harrish Basori — NIM 245150407141002
Rekayasa Sistem Informasi

Folder ini berisi 5 diagram master, satu diagram untuk setiap jenis diagram.
Setiap diagram mencakup seluruh 10 studi kasus TravelKu.

DAFTAR FILE
-----------
01_master_usecase_10_kasus.png
    Diagram use case master.
    Satu system boundary, 4 modul (Kepegawaian, Pemesanan Tiket,
    Member, Manajemen Travel), 37 use case, 6 aktor, relasi include/extend.
    Studi kasus 01-10.

02_master_class_10_kasus.png
    Diagram class master.
    39 kelas: 11 boundary, 11 control, 17 entity.
    Relasi boundary -> control, inheritance, dan asosiasi inti entitas.
    Pemetaan entitas yang diakses setiap control ditulis pada kaki kartu control.
    Studi kasus 01-10.

03_master_domain_10_kasus.png
    Domain model master.
    17 entitas domain dengan atribut, asosiasi, peran, dan multiplisitas.
    Mencakup domain kepegawaian, pengguna, transaksi, dan penerbangan.
    Studi kasus 01-10.

04_master_robustness_10_kasus.png
    Robustness diagram master.
    10 panel robustness (boundary-control-entity), satu panel per studi kasus.
    Disusun 2 kolom x 5 baris.

05_master_sequence_10_kasus.png
    Sequence diagram master.
    10 panel sequence, satu panel per studi kasus.
    Disusun 3 kolom x 4 baris, dilengkapi panduan membaca dan peta studi kasus.

SPESIFIKASI
-----------
- Format: PNG
- Resolusi:
  01 usecase     : 8800 x 4700 px
  02 class       : 9200 x 4700 px
  03 domain      : 9000 x 3700 px
  04 robustness  : 8800 x 12663 px
  05 sequence    : 8800 x 13527 px
- Latar: terang, kartu putih, aksen navy/teal.
- Semua teks menggunakan Arial; ukuran dijaga agar tetap terbaca saat zoom.

CATATAN
-------
- Diagram use case, class, dan domain digambar ulang secara terpadu:
  use case dan entitas yang sama tidak diduplikasi.
- Diagram robustness dan sequence mempertahankan diagram sumber
  tanpa mengubah isi, aktor, objek, atau alur; panel hanya disusun ulang
  dalam satu lembar besar dengan judul dan nomor studi kasus.
- Pada domain model, "Pengguna" adalah generalisasi peran Penumpang,
  Member, Pengunjung, dan Manajer Travel. Peran Pengunjung dan
  Manajer Travel tetap ditampilkan sebagai entitas tersendiri karena
  memiliki relasi langsung ke Pemesanan.
- Sumber: 50 diagram konseptual pada folder
  /Users/tristan/Downloads/diagram-konseptual 2

CARA MENGGUNAKAN
----------------
- Untuk presentasi: buka PNG dan zoom ke panel/use case yang dibahas.
- Untuk lampiran laporan: gunakan file PNG apa adanya.
- Untuk cetak: gunakan kertas A1/A0, atau cetak per panel.
  Diagram robustness dan sequence sengaja dibuat panjang agar teks tetap tajam;
  untuk paparan di layar, zoom ke panel yang sedang dibahas.
