import { requireRole } from "@/lib/auth/session";

export default async function HrdLayout({ children }: { children: React.ReactNode }) {
  await requireRole("HRD_MANAGER");
  return children;
}
