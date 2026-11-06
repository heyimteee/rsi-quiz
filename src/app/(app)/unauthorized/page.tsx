import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata = { title: "Akses ditolak" };

export default function UnauthorizedPage() {
  return (
    <div className="mx-auto max-w-lg py-16">
      <EmptyState
        icon={ShieldAlert}
        title="Akses ditolak"
        description="Akun Anda tidak memiliki hak akses untuk membuka halaman ini. Silakan kembali ke halaman utama sesuai peran Anda."
        action={
          <Link href="/" className="btn-primary">
            Kembali ke beranda
          </Link>
        }
      />
    </div>
  );
}
