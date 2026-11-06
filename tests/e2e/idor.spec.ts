import { expect, test, type Page } from "@playwright/test";

async function login(page: Page, button: RegExp, home: RegExp) {
  await page.goto("/login");
  await page.getByRole("button", { name: button }).click();
  await expect(page).toHaveURL(home);
}

test.describe("IDOR dan akses detail", () => {
  test("penumpang tidak dapat membuka detail pemesanan penumpang lain", async ({ browser }) => {
    const ownerContext = await browser.newContext();
    const ownerPage = await ownerContext.newPage();
    await login(ownerPage, /Pelanggan/, /\/penerbangan/);
    await ownerPage.goto("/pemesanan");
    const href = await ownerPage
      .getByRole("link", { name: "Lihat detail" })
      .first()
      .getAttribute("href");
    expect(href).toBeTruthy();
    await ownerContext.close();

    const otherContext = await browser.newContext();
    const otherPage = await otherContext.newPage();
    await login(otherPage, /Calon Penumpang/, /\/penerbangan/);
    const response = await otherPage.goto(href as string);
    expect(response?.status()).toBe(404);
    await expect(otherPage.getByText("Halaman tidak ditemukan")).toBeVisible();
    await otherContext.close();
  });

  test("member tidak dapat membuka rencana perjalanan member lain", async ({ browser }) => {
    const ownerContext = await browser.newContext();
    const ownerPage = await ownerContext.newPage();
    await login(ownerPage, /Member \(profil lengkap\)/, /\/member\/penerbangan/);
    await ownerPage.goto("/member/rencana");
    const href = await ownerPage.getByRole("link", { name: "Buka rencana" }).first().getAttribute("href");
    expect(href).toBeTruthy();
    await ownerContext.close();

    const otherContext = await browser.newContext();
    const otherPage = await otherContext.newPage();
    await login(otherPage, /Member \(profil belum lengkap\)/, /\/member\/penerbangan/);
    const response = await otherPage.goto(href as string);
    expect(response?.status()).toBe(404);
    await expect(otherPage.getByText("Halaman tidak ditemukan")).toBeVisible();
    await otherContext.close();
  });

  test("pengunjung tidak dapat membuka tiket pengunjung lain", async ({ browser }) => {
    const ownerContext = await browser.newContext();
    const ownerPage = await ownerContext.newPage();
    await login(ownerPage, /^Pengunjung pengunjung@demo/, /\/tiket-saya/);
    await ownerPage.goto("/pemesanan");
    const href = await ownerPage
      .getByRole("link", { name: "Lihat detail" })
      .first()
      .getAttribute("href");
    expect(href).toBeTruthy();
    await ownerContext.close();

    const otherContext = await browser.newContext();
    const otherPage = await otherContext.newPage();
    await login(otherPage, /Pengunjung \(Budi\)/, /\/tiket-saya/);
    const response = await otherPage.goto(href as string);
    expect(response?.status()).toBe(404);
    await expect(otherPage.getByText("Halaman tidak ditemukan")).toBeVisible();
    await otherContext.close();
  });

  test("pengunjung tidak dapat membuka detail penerbangan", async ({ browser }) => {
    const passengerContext = await browser.newContext();
    const passengerPage = await passengerContext.newPage();
    await login(passengerPage, /Calon Penumpang/, /\/penerbangan/);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const date = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, "0")}-${String(tomorrow.getDate()).padStart(2, "0")}`;
    await passengerPage.goto(`/penerbangan?asal=CGK&tujuan=DPS&tanggal=${date}`);
    const href = await passengerPage
      .getByRole("link", { name: /Lihat & pesan/ })
      .first()
      .getAttribute("href");
    expect(href).toBeTruthy();
    await passengerContext.close();

    const visitorContext = await browser.newContext();
    const visitorPage = await visitorContext.newPage();
    await login(visitorPage, /^Pengunjung pengunjung@demo/, /\/tiket-saya/);
    await visitorPage.goto(href as string);
    await expect(visitorPage).toHaveURL(/\/unauthorized/);
    await visitorContext.close();
  });
});
