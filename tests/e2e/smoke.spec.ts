import { expect, test } from "@playwright/test";

test.describe("fondasi aplikasi", () => {
  test("halaman login tampil dengan akun demo", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "Masuk ke akun Anda" })).toBeVisible();
    await expect(page.getByRole("button", { name: /Manajer HRD/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /Member \(profil lengkap\)/ })).toBeVisible();
  });

  test("quick login HRD membuka modul cuti", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: /Manajer HRD/ }).click();
    await expect(page).toHaveURL(/\/hrd\/cuti/);
    await expect(page.getByRole("heading", { name: "Daftar Pengajuan Cuti" })).toBeVisible();
  });

  test("HRD tidak dapat membuka halaman member", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: /Manajer HRD/ }).click();
    await expect(page).toHaveURL(/\/hrd\/cuti/);
    await page.goto("/member/profil");
    await expect(page).toHaveURL(/\/unauthorized/);
    await expect(page.getByText("Akses ditolak")).toBeVisible();
  });

  test("database E2E berisi seed yang benar", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: /Manajer HRD/ }).click();
    await expect(page).toHaveURL(/\/hrd\/cuti/);
    await page.goto("/hrd/pegawai");
    await expect(page.getByTestId("employee-row")).toHaveCount(8);
  });

  test("semua peran non-HRD ditolak dari modul HRD", async ({ browser }) => {
    const roles = [
      { name: /Calon Penumpang/, home: /\/penerbangan/ },
      { name: /Member \(profil lengkap\)/, home: /\/member\/penerbangan/ },
      { name: /Manajer Travel/, home: /\/travel\/pemesanan/ },
      { name: /^Pengunjung pengunjung@demo/, home: /\/tiket-saya/ },
    ];
    for (const role of roles) {
      const context = await browser.newContext();
      const page = await context.newPage();
      await page.goto("/login");
      await page.getByRole("button", { name: role.name }).click();
      await expect(page).toHaveURL(role.home);
      await page.goto("/hrd/cuti");
      await expect(page).toHaveURL(/\/unauthorized/);
      await context.close();
    }
  });

  test("pengunjung hanya melihat menu tiket saya", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: /^Pengunjung pengunjung@demo/ }).click();
    await expect(page).toHaveURL(/\/tiket-saya/);
    await expect(page.getByRole("link", { name: "Tiket Saya" })).toBeVisible();
  });
});
