import { ComingSoon } from "@/components/ui/coming-soon";
import { requireRole } from "@/lib/auth/session";

export const metadata = { title: "Pemesanan Saya" };

export default async function Page() {
  await requireRole(["PASSENGER", "MEMBER", "VISITOR"]);
  return (
    <ComingSoon
      caseNumber="02"
      title="Pemesanan Saya"
      description="Melihat seluruh pemesanan dan membatalkan tiket yang masih aktif."
    />
  );
}
