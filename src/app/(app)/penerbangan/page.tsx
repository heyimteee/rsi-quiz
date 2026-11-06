import { ComingSoon } from "@/components/ui/coming-soon";
import { requireRole } from "@/lib/auth/session";

export const metadata = { title: "Cari Jadwal Penerbangan" };

export default async function Page() {
  await requireRole(["PASSENGER", "MEMBER"]);
  return (
    <ComingSoon
      caseNumber="02"
      title="Cari Jadwal Penerbangan"
      description="Mencari penerbangan berdasarkan tujuan dan tanggal, lalu memesan atau membatalkan tiket."
    />
  );
}
