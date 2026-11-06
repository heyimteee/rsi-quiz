import { requireRole } from "@/lib/auth/session";

export default async function MemberLayout({ children }: { children: React.ReactNode }) {
  await requireRole("MEMBER");
  return children;
}
