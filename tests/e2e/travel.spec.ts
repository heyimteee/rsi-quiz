import { expect, test, type Page } from "@playwright/test";

function dateString(offsetDays: number) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

async function loginAsTravel(page: Page) {
  await page.goto("/login");
  await page.getByRole("button", { name: /Manajer Travel/ }).click();
  await expect(page).toHaveURL(/\/travel\/pemesanan/);
}

test.describe("studi kasus 07 - status pemesanan", () => {
  test("menampilkan semua status dan memfilter waiting for payment", async ({ page }) => {
    await loginAsTravel(page);
    await expect(page.getByRole("heading", { name: "Status Pemesanan Tiket" })).toBeVisible();
    expect(await page.getByTestId("travel-booking-row").count()).toBeGreaterThanOrEqual(10);

    await page.getByRole("tab", { name: /Waiting for Payment/ }).click();
    await expect(page).toHaveURL(/status=WAITING_FOR_PAYMENT/);
    await expect(page.getByTestId("travel-booking-row")).toHaveCount(1);
    await expect(
      page.getByTestId("travel-booking-row").filter({ hasText: "TRV-DEMO02" }),
    ).toHaveCount(1);

    await page.getByRole("tab", { name: /^Semua/ }).click();
    await expect(page).toHaveURL(/status=all/);
    expect(await page.getByTestId("travel-booking-row").count()).toBeGreaterThanOrEqual(10);
  });

  test("memfilter status confirmed, booked, waiting, dan cancelled", async ({ page }) => {
    await loginAsTravel(page);
    for (const [status, label] of [
      ["CONFIRMED", "Confirmed"],
      ["BOOKED", "Booked"],
      ["WAITING_FOR_PAYMENT", "Waiting for Payment"],
      ["CANCELLED", "Cancelled"],
    ] as const) {
      await page.goto(`/travel/pemesanan?status=${status}`);
      const rows = page.getByTestId("travel-booking-row");
      expect(await rows.count()).toBeGreaterThanOrEqual(1);
      for (const text of await rows.allTextContents()) {
        expect(text).toContain(label);
      }
    }
  });

  test("mencari pemesanan berdasarkan kode booking", async ({ page }) => {
    await loginAsTravel(page);
    await page.getByLabel(/Cari kode booking/).fill("TRV-DEMO05");
    await page.getByRole("button", { name: "Cari" }).click();
    await expect(page).toHaveURL(/q=TRV-DEMO05/);
    await expect(page.getByTestId("travel-booking-row")).toHaveCount(1);
    await expect(
      page.getByTestId("travel-booking-row").filter({ hasText: "TRV-DEMO05" }),
    ).toHaveCount(1);
  });
});

test.describe("studi kasus 08 - pesan untuk pengunjung", () => {
  test("manajer memesan untuk pengunjung, tiket terlihat di akun dan email", async ({ browser }) => {
    const travelContext = await browser.newContext();
    const travelPage = await travelContext.newPage();
    await loginAsTravel(travelPage);

    await travelPage.goto(
      `/travel/cari?asal=CGK&tujuan=DPS&tanggal=${dateString(1)}`,
    );
    await expect(travelPage.getByTestId("flight-card").first()).toBeVisible();
    await travelPage.getByRole("link", { name: /Pesan untuk pengunjung/ }).first().click();
    await expect(travelPage).toHaveURL(/\/travel\/pesan\/.+/);
    await expect(travelPage.getByTestId("visitor-booking-form")).toBeVisible();
    const html = await travelPage.content();
    expect(html).not.toContain("3171042209940004");
    expect(html).not.toContain("3171050508880005");

    const visitorSelect = travelPage.getByLabel("Pengunjung", { exact: true });
    const optionValue = await visitorSelect
      .locator("option")
      .filter({ hasText: "pengunjung@demo.test" })
      .getAttribute("value");
    expect(optionValue).toBeTruthy();
    await visitorSelect.selectOption(optionValue as string);
    await travelPage.getByRole("button", { name: /Pesan tiket untuk pengunjung/ }).click();
    await expect(travelPage).toHaveURL(/\/travel\/pemesanan\/.+\?baru=1/);
    const reference = (await travelPage.getByTestId("travel-booking-reference").innerText()).trim();
    expect(reference).toMatch(/^TRV-[A-Z0-9]{6}$/);

    const visitorContext = await browser.newContext();
    const visitorPage = await visitorContext.newPage();
    await visitorPage.goto("/login");
    await visitorPage.getByRole("button", { name: /^Pengunjung pengunjung@demo/ }).click();
    await expect(visitorPage).toHaveURL(/\/tiket-saya/);
    await expect(visitorPage.getByText(reference)).toBeVisible();
    await expect(visitorPage.getByTestId("visitor-ticket").first()).toBeVisible();

    await travelPage.goto("/dev/email");
    await expect(travelPage.getByTestId("email-outbox-item").first()).toBeVisible();
    await expect(travelPage.getByText("pengunjung@demo.test").first()).toBeVisible();
    await expect(travelPage.getByText(reference).first()).toBeVisible();

    await visitorContext.close();
    await travelContext.close();
  });

  test("pengunjung tidak dapat membuka modul manajer travel", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: /^Pengunjung pengunjung@demo/ }).click();
    await expect(page).toHaveURL(/\/tiket-saya/);
    await page.goto("/travel/pemesanan");
    await expect(page).toHaveURL(/\/unauthorized/);
  });
});

test.describe("studi kasus 09 - verifikasi kode booking", () => {
  test("menampilkan pesan untuk kode salah lalu status untuk kode benar", async ({ page }) => {
    await loginAsTravel(page);
    await page.goto("/travel/verifikasi?kode=TRV-SALAH");
    await expect(page.getByText("Kode booking reference tidak sesuai").first()).toBeVisible();
    await expect(page.getByTestId("reference-result")).toHaveCount(0);

    await page.goto("/travel/verifikasi?kode=%20%20%20");
    await expect(page.getByText("Kode booking reference tidak sesuai").first()).toBeVisible();

    await page.getByLabel("Kode booking reference").fill(" trv-demo01 ");
    await page.getByRole("button", { name: "Periksa status" }).click();
    await expect(page).toHaveURL(/kode=/);
    await expect(page.getByTestId("reference-result")).toBeVisible();
    await expect(page.getByText("TRV-DEMO01").first()).toBeVisible();
    await expect(page.getByText("Confirmed").first()).toBeVisible();
  });
});
