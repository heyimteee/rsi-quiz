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

  test("pengunjung hanya melihat menu tiket saya", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: /^Pengunjung pengunjung@demo/ }).click();
    await expect(page).toHaveURL(/\/tiket-saya/);
    await expect(page.getByRole("link", { name: "Tiket Saya" })).toBeVisible();
  });
});
