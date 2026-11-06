import { expect, test, type Page } from "@playwright/test";

function dateString(offsetDays: number) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

async function loginAsPassenger(page: Page) {
  await page.goto("/login");
  await page.getByRole("button", { name: /Calon Penumpang/ }).click();
  await expect(page).toHaveURL(/\/penerbangan/);
}

test.describe("studi kasus 02 - pencarian, pemesanan, pembatalan", () => {
  test("mencari penerbangan dan melihat detail harga", async ({ page }) => {
    await loginAsPassenger(page);
    await page.getByLabel("Tanggal berangkat").fill(dateString(1));
    await page.getByRole("button", { name: "Cari" }).click();
    await expect(page).toHaveURL(/tanggal=/);
    const cards = page.getByTestId("flight-card");
    await expect(cards.first()).toBeVisible();
    expect(await cards.count()).toBeGreaterThanOrEqual(2);

    await page.getByRole("link", { name: /Lihat & pesan/ }).first().click();
    await expect(page).toHaveURL(/\/penerbangan\/.+/);
    await expect(page.getByTestId("flight-detail")).toBeVisible();
    await expect(page.getByText("Data penumpang")).toBeVisible();
    await expect(page.getByTestId("booking-form")).toBeVisible();
  });

  test("memesan tiket lalu membatalkannya", async ({ page }) => {
    await loginAsPassenger(page);
    await page.getByLabel("Tanggal berangkat").fill(dateString(1));
    await page.getByRole("button", { name: "Cari" }).click();
    await page.getByRole("link", { name: /Lihat & pesan/ }).first().click();
    await page.getByRole("button", { name: /Pesan tiket sekarang/ }).click();

    await expect(page).toHaveURL(/\/pemesanan\/.+\?baru=1/);
    await expect(page.getByText("Pemesanan berhasil", { exact: false })).toBeVisible();
    const reference = (await page.getByTestId("booking-reference").innerText()).trim();
    expect(reference).toMatch(/^TRV-[A-Z0-9]{6}$/);
    await expect(page.getByText("Confirmed")).toBeVisible();
    await expect(page.getByTestId("booking-segment")).toHaveCount(1);

    await page.goto("/pemesanan");
    await expect(page.getByText(reference)).toBeVisible();
    await page.getByRole("link", { name: "Lihat detail" }).first().click();
    page.on("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "Batalkan pemesanan" }).click();

    await expect(page).toHaveURL(/dibatalkan=1/);
    await expect(page.getByText("Pemesanan berhasil dibatalkan")).toBeVisible();
    await expect(page.getByText("Cancelled", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Batalkan pemesanan" })).toHaveCount(0);
  });
});

test.describe("studi kasus 03 - perbandingan dua tujuan", () => {
  test("menampilkan dua kolom tujuan dengan jadwal, maskapai, dan harga", async ({ page }) => {
    await loginAsPassenger(page);
    await page.goto(
      `/penerbangan/bandingkan?asal=CGK&tujuan1=DPS&tujuan2=SUB&tanggal=${dateString(1)}`,
    );
    await expect(page.getByRole("heading", { name: "Bandingkan Dua Tujuan" })).toBeVisible();
    await expect(page.getByTestId("compare-column")).toHaveCount(2);
    await expect(page.getByTestId("flight-card").first()).toBeVisible();
    await expect(page.getByRole("heading", { name: /Denpasar \(DPS\)/ })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Surabaya \(SUB\)/ })).toBeVisible();
    await expect(page.getByText(/lebih murah/).first()).toBeVisible();
  });

  test("menolak perbandingan dengan tujuan yang sama", async ({ page }) => {
    await loginAsPassenger(page);
    await page.goto("/penerbangan/bandingkan?asal=CGK&tujuan1=DPS&tujuan2=DPS");
    await expect(page.getByText("Pilih dua tujuan yang berbeda untuk dibandingkan.")).toBeVisible();
  });
});

test.describe("studi kasus 10 - pulang-pergi", () => {
  test("memesan tiket pulang-pergi dan menampilkan total serta dua segmen", async ({ page }) => {
    await loginAsPassenger(page);
    const departure = dateString(4);
    const returnDate = dateString(7);
    await page.goto(
      `/pulang-pergi?cari=1&asal=CGK&tujuan=DPS&berangkat=${departure}&pulang=${returnDate}`,
    );
    await expect(page.getByTestId("outbound-option").first()).toBeVisible();
    await expect(page.getByTestId("return-option").first()).toBeVisible();

    await page.getByTestId("outbound-option").first().click();
    await page.getByTestId("return-option").first().click();
    await page.getByRole("button", { name: "Lanjut ke data penumpang" }).click();
    await expect(page).toHaveURL(/\/pulang-pergi\/penumpang/);
    await expect(page.getByTestId("roundtrip-segment")).toHaveCount(2);
    await expect(page.getByText("Total pulang-pergi")).toBeVisible();

    await page.getByRole("button", { name: /Konfirmasi pemesanan pulang-pergi/ }).click();
    await expect(page).toHaveURL(/\/pemesanan\/.+\?baru=1&pp=1/);
    await expect(page.getByTestId("booking-segment")).toHaveCount(2);
    await expect(page.getByTestId("booking-reference")).toBeVisible();
    await expect(page.getByText("Pemesanan berhasil", { exact: false })).toBeVisible();
  });

  test("menolak tanggal kepulangan sebelum keberangkatan", async ({ page }) => {
    await loginAsPassenger(page);
    await page.goto(
      `/pulang-pergi?cari=1&asal=CGK&tujuan=DPS&berangkat=${dateString(5)}&pulang=${dateString(4)}`,
    );
    await expect(
      page.getByText("Tanggal kepulangan tidak boleh lebih awal daripada tanggal keberangkatan"),
    ).toBeVisible();
  });

  test("menampilkan pesan saat penerbangan tidak tersedia", async ({ page }) => {
    await loginAsPassenger(page);
    await page.goto(
      `/pulang-pergi?cari=1&asal=UPG&tujuan=JOG&berangkat=${dateString(4)}&pulang=${dateString(7)}`,
    );
    await expect(
      page.getByText("Penerbangan tidak tersedia untuk kriteria yang dipilih"),
    ).toBeVisible();
  });
});
