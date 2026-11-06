# Folder Usability — Data Simulasi

> **PENTING:** Seluruh data pada folder ini adalah **simulasi** untuk keperluan demonstrasi
> akademik. Data tidak berasal dari partisipan manusia nyata dan tidak boleh dipresentasikan
> sebagai penelitian pengguna sungguhan.

## Isi

| File | Keterangan |
|---|---|
| `kuesioner-sus.md` | Instrumen 10 pertanyaan SUS + rumus skor |
| `skenario-tugas.md` | Enam tugas, kriteria berhasil, batas waktu |
| `data-sus-simulasi.csv` | Jawaban 8 responden simulasi (10 item) |
| `data-tugas-simulasi.csv` | 48 baris metrik tugas (8 responden × 6 tugas) |
| `hasil-simulasi.md` | Hasil hitung skor SUS dan metrik tugas |
| `../04-usability-testing.md` | Laporan analisis, temuan, dan rekomendasi |

## Menghitung ulang

```bash
node scripts/hitung-usability.mjs
node scripts/hitung-usability.mjs --write
```

Skrip menghitung skor SUS, rata-rata, simpangan baku, success rate, waktu, error, dan SEQ.
