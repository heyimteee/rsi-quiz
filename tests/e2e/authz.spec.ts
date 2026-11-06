import { expect, test, type Page } from "@playwright/test";

type RoleCase = {
  label: string;
  button: RegExp;
  home: RegExp;
};

const roles: Record<string, RoleCase> = {
  HRD_MANAGER: { label: "HRD", button: /Manajer HRD/, home: /\/hrd\/cuti/ },
  PASSENGER: { label: "Penumpang", button: /Calon Penumpang/, home: /\/penerbangan/ },
  MEMBER: { label: "Member", button: /Member \(profil lengkap\)/, home: /\/member\/penerbangan/ },
  TRAVEL_MANAGER: { label: "Travel", button: /Manajer Travel/, home: /\/travel\/pemesanan/ },
  VISITOR: { label: "Pengunjung", button: /^Pengunjung pengunjung@demo/, home: /\/tiket-saya/ },
};

const routes = [
  { path: "/hrd/cuti", allowed: ["HRD_MANAGER"] },
  { path: "/hrd/pegawai", allowed: ["HRD_MANAGER"] },
  { path: "/member/profil", allowed: ["MEMBER"] },
  { path: "/member/validasi", allowed: ["MEMBER"] },
  { path: "/member/penerbangan", allowed: ["MEMBER"] },
  { path: "/member/rencana", allowed: ["MEMBER"] },
  { path: "/member/rencana/baru", allowed: ["MEMBER"] },
  { path: "/member/pencarian-multi", allowed: ["MEMBER"] },
  { path: "/travel/pemesanan", allowed: ["TRAVEL_MANAGER"] },
  { path: "/travel/cari", allowed: ["TRAVEL_MANAGER"] },
  { path: "/travel/verifikasi", allowed: ["TRAVEL_MANAGER"] },
  { path: "/dev/email", allowed: ["TRAVEL_MANAGER"] },
  { path: "/tiket-saya", allowed: ["VISITOR"] },
  { path: "/penerbangan", allowed: ["PASSENGER", "MEMBER"] },
  { path: "/penerbangan/bandingkan", allowed: ["PASSENGER", "MEMBER"] },
  { path: "/pulang-pergi", allowed: ["PASSENGER", "MEMBER"] },
  { path: "/pulang-pergi/penumpang", allowed: ["PASSENGER", "MEMBER"] },
  { path: "/pemesanan", allowed: ["PASSENGER", "MEMBER", "VISITOR"] },
];

async function login(page: Page, role: RoleCase) {
  await page.goto("/login");
  await page.getByRole("button", { name: role.button }).click();
  await expect(page).toHaveURL(role.home);
}

test.describe("matriks otorisasi peran", () => {
  for (const [roleKey, role] of Object.entries(roles)) {
    test(`${role.label} hanya dapat mengakses rute yang diizinkan`, async ({ browser }) => {
      const context = await browser.newContext();
      const page = await context.newPage();
      await login(page, role);

      for (const route of routes) {
        await page.goto(route.path);
        if (route.allowed.includes(roleKey)) {
          await expect(page).not.toHaveURL(/\/unauthorized/);
          await expect(page.locator("main#main-content")).toBeVisible();
        } else {
          await expect(page).toHaveURL(/\/unauthorized/);
        }
      }

      await context.close();
    });
  }

  test("pengguna anonim diarahkan ke halaman login", async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    for (const route of ["/hrd/cuti", "/member/profil", "/travel/pemesanan", "/tiket-saya"]) {
      await page.goto(route);
      await expect(page).toHaveURL(/\/login/);
    }
    await context.close();
  });
});
