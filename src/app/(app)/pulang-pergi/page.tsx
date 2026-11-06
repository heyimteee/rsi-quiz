import { ComingSoon } from "@/components/ui/coming-soon";
import { requireRole } from "@/lib/auth/session";

export const metadata = { title: "Pemesanan Pulang-Pergi" };

export default async function Page() {
  await requireRole(["PASSENGER", "MEMBER"]);
  return (
    <ComingSoon
      caseNumber="10"
      title="Pemesanan Pulang-Pergi"
      description="Memesan tiket pulang-pergi dengan validasi tanggal dan rincian total harga."
    />
  );
}
