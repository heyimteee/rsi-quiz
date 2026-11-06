import { expect, test, type Page } from "@playwright/test";

test.use({ viewport: { width: 390, height: 844 } });

async function expectNoPageOverflow(page: Page) {
  const hasOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth + 1,
  );
  expect(hasOverflow).toBe(false);
}

test.describe("tampilan seluler 390px", () => {
  test("login tidak mengalami overflow dan akun demo tetap dapat digunakan", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "Masuk ke akun Anda" })).toBeVisible();
    await expect(page.getByRole("button", { name: /Manajer HRD/ })).toBeVisible();
    await expectNoPageOverflow(page);

    await page.getByRole("button", { name: /Manajer HRD/ }).click();
    await expect(page).toHaveURL(/\/hrd\/cuti/);
    await expectNoPageOverflow(page);
  });

  test("daftar cuti HRD tetap terbaca pada layar kecil", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: /Manajer HRD/ }).click();
    await expect(page).toHaveURL(/\/hrd\/cuti/);
    await expect(page.getByTestId("leave-row").first()).toBeVisible();
    await expectNoPageOverflow(page);
  });

  test("daftar status travel memakai kartu seluler, bukan tabel lebar", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: /Manajer Travel/ }).click();
    await expect(page).toHaveURL(/\/travel\/pemesanan/);
    await expect(page.getByTestId("travel-booking-card").first()).toBeVisible();
    await expect(page.getByTestId("travel-booking-row").first()).toBeHidden();
    await expectNoPageOverflow(page);

    await page.getByRole("tab", { name: /Cancelled/ }).click();
    await expect(page).toHaveURL(/status=CANCELLED/);
    await expect(page.getByTestId("travel-booking-card").first()).toBeVisible();
    await expectNoPageOverflow(page);
  });

  test("detail cuti HRD dapat dibuka pada layar kecil", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: /Manajer HRD/ }).click();
    await expect(page).toHaveURL(/\/hrd\/cuti/);
    await page.getByRole("link", { name: /Lihat detail cuti/ }).first().click();
    await expect(page.getByRole("heading", { name: "Detail Pengajuan Cuti" })).toBeVisible();
    await expectNoPageOverflow(page);
  });

  test("pencarian member dan form pemesanan tetap dapat digunakan", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: /Member \(profil lengkap\)/ }).click();
    await expect(page).toHaveURL(/\/member\/penerbangan/);
    await expect(page.getByTestId("member-flight-row").first()).toBeVisible();
    await expectNoPageOverflow(page);

    await page.getByRole("link", { name: /^Pesan / }).first().click();
    await expect(page).toHaveURL(/\/penerbangan\/.+/);
    await expect(page.getByTestId("booking-form")).toBeVisible();
    await expectNoPageOverflow(page);
  });

  test("tiket pengunjung tampil pada layar kecil", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: /^Pengunjung pengunjung@demo/ }).click();
    await expect(page).toHaveURL(/\/tiket-saya/);
    await expect(page.getByTestId("visitor-ticket").first()).toBeVisible();
    await expectNoPageOverflow(page);
  });
});
