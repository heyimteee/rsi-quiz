import { expect, test } from "@playwright/test";

async function loginAsHrd(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.getByRole("button", { name: /Manajer HRD/ }).click();
  await expect(page).toHaveURL(/\/hrd\/cuti/);
}

test.describe("studi kasus 01 - cuti HRD", () => {
  test("menampilkan pengajuan cuti pada bulan berjalan", async ({ page }) => {
    await loginAsHrd(page);
    await expect(page.getByRole("heading", { name: "Daftar Pengajuan Cuti" })).toBeVisible();
    const rows = page.getByTestId("leave-row");
    expect(await rows.count()).toBeGreaterThanOrEqual(5);
    await expect(page.getByText("Pegawai mengajukan")).toBeVisible();
  });

  test("filter tanggal spesifik menampilkan pengajuan yang beririsan", async ({ page }) => {
    await loginAsHrd(page);
    await page.getByLabel(/Tanggal/).selectOption("1");
    await page.getByRole("button", { name: "Tampilkan" }).click();
    await expect(page).toHaveURL(/tanggal=1/);
    const rows = page.getByTestId("leave-row");
    expect(await rows.count()).toBeGreaterThanOrEqual(1);
  });

  test("periode kosong menampilkan empty state", async ({ page }) => {
    await loginAsHrd(page);
    const emptyYear = new Date().getFullYear() - 2;
    await page.getByLabel("Tahun").selectOption(String(emptyYear));
    await page.getByRole("button", { name: "Tampilkan" }).click();
    await expect(page.getByText("Tidak ada pengajuan cuti")).toBeVisible();
  });

  test("membuka detail pengajuan dan riwayat pegawai", async ({ page }) => {
    await loginAsHrd(page);
    await page.getByRole("link", { name: /Lihat detail cuti/ }).first().click();
    await expect(page.getByRole("heading", { name: "Detail Pengajuan Cuti" })).toBeVisible();
    await expect(page.getByText("Durasi cuti")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Hak cuti" })).toBeVisible();

    await page.getByRole("link", { name: "Lihat riwayat cuti" }).click();
    await expect(page.getByText("Sisa tahun berjalan")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Riwayat pengajuan cuti" })).toBeVisible();
  });

  test("riwayat cuti lintas tahun menampilkan pembagian per tahun", async ({ page }) => {
    await loginAsHrd(page);
    await page.goto("/hrd/pegawai?q=Fitri");
    await page.getByRole("link", { name: /Lihat riwayat cuti Fitri/ }).click();
    await expect(page.getByText("Liburan akhir tahun")).toBeVisible();
    await expect(page.getByText(/:\s*4 hari\s*·\s*\d{4}:\s*3 hari/)).toBeVisible();
  });
});
