import { ComingSoon } from "@/components/ui/coming-soon";
import { requireRole } from "@/lib/auth/session";

export const metadata = { title: "Tiket Saya" };

export default async function Page() {
  await requireRole("VISITOR");
  return (
    <ComingSoon
      caseNumber="08"
      title="Tiket Saya"
      description="Melihat tiket yang telah dipesankan atas nama pengunjung."
    />
  );
}
