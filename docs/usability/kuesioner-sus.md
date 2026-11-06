# Kuesioner System Usability Scale (SUS)

> **Instrumen simulasi.** Kuesioner ini disiapkan untuk studi usability simulasi pada
> dokumen `04-usability-testing.md`. Jika digunakan dengan responden nyata, diperlukan
> lembar persetujuan, penjelasan tujuan, dan jaminan anonimitas.

## Petunjuk

Berikan penilaian 1–5 untuk setiap pernyataan berdasarkan pengalaman Anda menggunakan
aplikasi TravelKu.

| Nilai | Arti |
|---:|---|
| 1 | Sangat tidak setuju |
| 2 | Tidak setuju |
| 3 | Netral |
| 4 | Setuju |
| 5 | Sangat setuju |

## Pernyataan

1. Saya ingin sering menggunakan sistem ini.
2. Saya merasa sistem ini terlalu rumit.
3. Saya merasa sistem ini mudah digunakan.
4. Saya merasa membutuhkan bantuan teknis untuk menggunakan sistem ini.
5. Saya merasa fitur-fitur sistem ini berjalan dengan baik.
6. Saya merasa terlalu banyak ketidakkonsistenan dalam sistem ini.
7. Saya membayangkan orang lain akan cepat memahami sistem ini.
8. Saya merasa sistem ini sangat canggung untuk digunakan.
9. Saya merasa percaya diri saat menggunakan sistem ini.
10. Saya perlu belajar banyak hal sebelum menggunakan sistem ini.

## Rumus skor

Untuk setiap responden:

- Item ganjil (1, 3, 5, 7, 9): skor kontribusi = `nilai − 1`
- Item genap (2, 4, 6, 8, 10): skor kontribusi = `5 − nilai`
- Jumlahkan sepuluh kontribusi, lalu kalikan **2,5**.
- Rentang skor: 0–100.

Rata-rata SUS dihitung dari seluruh responden. Interpretasi yang dipakai pada laporan ini:
skor >80,3 dikategorikan **excellent / grade A** (Bangor et al.), dengan catatan bahwa data
 adalah simulasi.

## Lembar jawaban (contoh format)

| Responden | Q1 | Q2 | Q3 | Q4 | Q5 | Q6 | Q7 | Q8 | Q9 | Q10 | Skor |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| R1 | 5 | 1 | 4 | 1 | 5 | 1 | 4 | 1 | 5 | 2 | 92,5 |
| R2 | 4 | 1 | 5 | 1 | 4 | 2 | 4 | 1 | 5 | 2 | 87,5 |
| R3 | 5 | 2 | 4 | 1 | 5 | 1 | 4 | 2 | 4 | 1 | 87,5 |
| R4 | 4 | 1 | 5 | 2 | 4 | 1 | 5 | 1 | 4 | 2 | 87,5 |
| R5 | 5 | 1 | 5 | 1 | 4 | 2 | 4 | 1 | 5 | 1 | 92,5 |
| R6 | 4 | 2 | 4 | 1 | 5 | 1 | 4 | 2 | 5 | 2 | 85,0 |
| R7 | 5 | 1 | 4 | 1 | 5 | 1 | 5 | 1 | 4 | 1 | 95,0 |
| R8 | 4 | 1 | 4 | 2 | 4 | 1 | 5 | 1 | 4 | 2 | 85,0 |

Data mentah: [`data-sus-simulasi.csv`](data-sus-simulasi.csv).

## Panduan moderator (jika diganti responden nyata)

1. Jelaskan bahwa tidak ada jawaban benar/salah dan penilaian bukan ujian.
2. Minta responden menyelesaikan tugas sambil berpikir keras (think-aloud).
3. Catat keberhasilan, waktu, jumlah error, dan SEQ setelah setiap tugas.
4. Setelah semua tugas, minta responden mengisi SUS.
5. Jangan membantu kecuali responden benar-benar macet; catat bantuan yang diberikan.
6. Akhiri dengan pertanyaan terbuka: bagian paling membingungkan dan paling membantu.
