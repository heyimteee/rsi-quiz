import { requireRole } from "@/lib/auth/session";

export default async function TravelLayout({ children }: { children: React.ReactNode }) {
  await requireRole("TRAVEL_MANAGER");
  return children;
}
