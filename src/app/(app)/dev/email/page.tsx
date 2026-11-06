import { ComingSoon } from "@/components/ui/coming-soon";
import { requireRole } from "@/lib/auth/session";

export const metadata = { title: "Email Outbox" };

export default async function Page() {
  await requireRole("TRAVEL_MANAGER");
  return (
    <ComingSoon
      caseNumber="08"
      title="Email Outbox"
      description="Kotak keluar simulasi pengiriman e-tiket kepada pengunjung."
    />
  );
}
