import { ComingSoon } from "@/components/ui/coming-soon";
import { requireRole } from "@/lib/auth/session";

export const metadata = { title: "Bandingkan Dua Tujuan" };

export default async function Page() {
  await requireRole(["PASSENGER", "MEMBER"]);
  return (
    <ComingSoon
      caseNumber="03"
      title="Bandingkan Dua Tujuan"
      description="Membandingkan ketersediaan, maskapai, dan harga penerbangan ke dua tujuan alternatif."
    />
  );
}
