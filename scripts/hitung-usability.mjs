#!/usr/bin/env node

/**
 * Menghitung skor SUS dan metrik tugas dari data simulasi.
 * Jalankan: node scripts/hitung-usability.mjs
 *
 * Catatan: data di docs/usability/*.csv adalah SIMULASI untuk demonstrasi
 * akademik, bukan data partisipan nyata.
 */
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const susPath = path.join(root, "docs/usability/data-sus-simulasi.csv");
const taskPath = path.join(root, "docs/usability/data-tugas-simulasi.csv");

function parseCsv(file) {
  const lines = fs.readFileSync(file, "utf8").trim().split(/\r?\n/);
  const headers = lines.shift().split(",");
  return lines.map((line) => {
    const cells = line.split(",");
    return Object.fromEntries(headers.map((header, index) => [header, cells[index]]));
  });
}

const susRows = parseCsv(susPath);
const susScores = susRows.map((row) => {
  let sum = 0;
  for (let index = 1; index <= 10; index++) {
    const score = Number(row[`q${index}`]);
    sum += index % 2 === 1 ? score - 1 : 5 - score;
  }
  return { respondent: row.respondent, role: row.role, score: sum * 2.5 };
});

const mean = (values) => values.reduce((sum, value) => sum + value, 0) / values.length;
const stddev = (values) => {
  const avg = mean(values);
  return Math.sqrt(mean(values.map((value) => (value - avg) ** 2)));
};

const scores = susScores.map((item) => item.score);
const susMean = mean(scores);
const susSd = stddev(scores);

const taskRows = parseCsv(taskPath);
const taskSummary = [...new Set(taskRows.map((row) => row.task_id))].map((taskId) => {
  const rows = taskRows.filter((row) => row.task_id === taskId);
  return {
    taskId,
    name: rows[0].task_name,
    successRate: (rows.filter((row) => row.success === "1").length / rows.length) * 100,
    avgTime: mean(rows.map((row) => Number(row.time_seconds))),
    avgErrors: mean(rows.map((row) => Number(row.errors))),
    avgSeq: mean(rows.map((row) => Number(row.seq))),
  };
});
const successRate = (taskRows.filter((row) => row.success === "1").length / taskRows.length) * 100;
const avgTime = mean(taskRows.map((row) => Number(row.time_seconds)));
const avgErrors = mean(taskRows.map((row) => Number(row.errors)));
const avgSeq = mean(taskRows.map((row) => Number(row.seq)));

const format = (value) => value.toFixed(2).replace(".", ",");

console.log("=== SKOR SUS ===");
for (const item of susScores) console.log(`${item.respondent}\t${item.role}\t${format(item.score)}`);
console.log(`Rata-rata\t${format(susMean)}`);
console.log(`Simpangan baku\t${format(susSd)}`);
console.log("\n=== METRIK TUGAS ===");
for (const task of taskSummary) {
  console.log(
    `${task.taskId}\t${format(task.successRate)}%\t${format(task.avgTime)} dtk\t${format(task.avgErrors)} error\tSEQ ${format(task.avgSeq)}`,
  );
}
console.log("\n=== AGREGAT ===");
console.log(`Task success rate\t${format(successRate)}%`);
console.log(`Rata-rata waktu\t${format(avgTime)} detik`);
console.log(`Rata-rata error\t${format(avgErrors)}`);
console.log(`Rata-rata SEQ\t${format(avgSeq)}`);

if (process.argv.includes("--write")) {
  const output = [
    "# Hasil Perhitungan Usability (Simulasi)",
    "",
    "> Data simulasi, bukan partisipan nyata.",
    "",
    "## Skor SUS per Responden",
    "",
    "| Responden | Peran | Skor SUS |",
    "|---|---|---:|",
    ...susScores.map((item) => `| ${item.respondent} | ${item.role} | ${format(item.score)} |`),
    "",
    `**Rata-rata SUS:** ${format(susMean)} · **Simpangan baku:** ${format(susSd)}`,
    "",
    "## Metrik Tugas",
    "",
    "| ID | Tugas | Success rate | Waktu rata-rata | Error rata-rata | SEQ |",
    "|---|---|---:|---:|---:|---:|",
    ...taskSummary.map(
      (task) =>
        `| ${task.taskId} | ${task.name} | ${format(task.successRate)}% | ${format(task.avgTime)} dtk | ${format(task.avgErrors)} | ${format(task.avgSeq)} |`,
    ),
    "",
    `**Agregat:** success rate ${format(successRate)}%, waktu ${format(avgTime)} detik, error ${format(avgErrors)}, SEQ ${format(avgSeq)}.`,
    "",
  ].join("\n");
  const outputPath = path.join(root, "docs/usability/hasil-simulasi.md");
  fs.writeFileSync(outputPath, output);
  console.log(`\nDitulis ke ${outputPath}`);
}
