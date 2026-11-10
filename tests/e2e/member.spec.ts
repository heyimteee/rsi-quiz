import { expect, test, type Page } from "@playwright/test";

function dateString(offsetDays: number) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

async function loginAsMember(page: Page) {
  await page.goto("/login");
  await page.getByRole("button", { name: /Member \(profil lengkap\)/ }).click();
  await expect(page).toHaveURL(/\/member\/penerbangan/);
}

async function loginAsIncompleteMember(page: Page) {
  await page.goto("/login");
  await page.getByRole("button", { name: /Member \(profil belum lengkap\)/ }).click();
  await expect(page).toHaveURL(/\/member\/penerbangan/);
}

test.describe("studi kasus 05 - profil dan validasi tiket", () => {
  test("member lengkap dapat memvalidasi tiket", async ({ page }) => {
    await loginAsMember(page);
    await page.goto("/member/profil");
    await expect(page.getByText("Semua data wajib sudah lengkap")).toBeVisible();
    await page.goto("/member/validasi");
    await page.getByRole("button", { name: /Validasi tiket/ }).click();
    await expect(page.getByText("Validasi berhasil")).toBeVisible();
  });

  test("member dengan profil tidak lengkap ditolak lalu dapat melengkapi profil", async ({ page }) => {
    await loginAsIncompleteMember(page);
    await page.goto("/member/validasi");
    await expect(page.getByText("Data profil belum lengkap").first()).toBeVisible();
    await page.getByRole("button", { name: /Validasi tiket/ }).click();
    await expect(page.getByText("Validasi tiket ditolak")).toBeVisible();
    await expect(page.getByText("Data profil tidak lengkap", { exact: true }).first()).toBeVisible();

    await page.goto("/member/profil");
    await page.getByLabel("NIK").fill("3171071404990007");
    await page.getByLabel("Tanggal lahir").fill("1999-04-14");
    await page.getByRole("button", { name: /Simpan profil/ }).click();
    await expect(page.getByText("Data profil berhasil diperbarui")).toBeVisible();
    await expect(page.getByText("Semua data wajib sudah lengkap")).toBeVisible();

    await page.goto("/member/validasi");
    await page.getByRole("button", { name: /Validasi tiket/ }).click();
    await expect(page.getByText("Validasi berhasil")).toBeVisible();
  });
});

test.describe("studi kasus 06 - preferensi dan pemesanan member", () => {
  test("membandingkan harga lalu memesan tiket", async ({ page }) => {
    await loginAsMember(page);
    await expect(page.getByRole("heading", { name: "Cari & Bandingkan Penerbangan" })).toBeVisible();
    await expect(page.getByTestId("member-flight-row").first()).toBeVisible();
    const rows = page.getByTestId("member-flight-row");
    expect(await rows.count()).toBeGreaterThanOrEqual(2);
    await expect(page.getByText("Termurah").first()).toBeVisible();
    await expect(page.getByText(/\+Rp/).first()).toBeVisible();

    await page.getByLabel("Tanggal berangkat").fill(dateString(2));
    await page.getByRole("button", { name: "Cari penerbangan" }).click();
    await expect(page).toHaveURL(/tanggal=/);
    await page.getByRole("link", { name: /^Pesan / }).first().click();
    await expect(page).toHaveURL(/\/penerbangan\/.+/);
    await page.getByRole("button", { name: /Pesan tiket sekarang/ }).click();
    await expect(page).toHaveURL(/\/pemesanan\/.+\?baru=1/);
    await expect(page.getByTestId("booking-reference")).toBeVisible();
    await expect(page.getByText("Confirmed", { exact: true })).toBeVisible();
  });
});

test.describe("studi kasus 04 - multi-destinasi", () => {
  test("membuat rencana perjalanan dan menambahkan rute lanjutan", async ({ page }) => {
    await loginAsMember(page);
    await page.goto("/member/rencana/baru");
    await page.getByLabel("Nama rencana perjalanan").fill("Uji Rencana E2E");
    await page.getByRole("button", { name: /Simpan rencana perjalanan/ }).click();
    await expect(page).toHaveURL(/\/member\/rencana\/.+\?baru=1/);
    await expect(page.getByTestId("itinerary-segment")).toHaveCount(2);

    await page.getByRole("button", { name: /Tambah rute lanjutan/ }).click();
    await expect(page).toHaveURL(/sukses=1/);
    await expect(page.getByTestId("itinerary-segment")).toHaveCount(3);
    await expect(page.getByText("Rute lanjutan berhasil ditambahkan")).toBeVisible();
  });

  test("mencari penerbangan dari rencana perjalanan tersimpan", async ({ page }) => {
    await loginAsMember(page);
    await page.goto("/member/rencana");
    await page.getByRole("link", { name: /Cari penerbangan/ }).first().click();
    await expect(page).toHaveURL(/\/member\/pencarian-multi/);
    await expect(page.getByTestId("multi-segment-result").first()).toBeVisible();
    await expect(page.getByText("Total termurah semua segmen")).toBeVisible();
  });

  test("pencarian manual multi-destinasi menampilkan dua segmen", async ({ page }) => {
    await loginAsMember(page);
    await page.goto(
      `/member/pencarian-multi?cari=1&asal1=CGK&tujuan1=DPS&tanggal1=${dateString(2)}&asal2=DPS&tujuan2=SUB&tanggal2=${dateString(5)}&asal3=&tujuan3=&tanggal3=`,
    );
    await expect(page.getByTestId("multi-segment-result")).toHaveCount(2);
  });
});

test.describe("otorisasi member", () => {
  test("calon penumpang tidak dapat membuka modul member", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: /Calon Penumpang/ }).click();
    await expect(page).toHaveURL(/\/penerbangan/);
    await page.goto("/member/profil");
    await expect(page).toHaveURL(/\/unauthorized/);
  });
});
