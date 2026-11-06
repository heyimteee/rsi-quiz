import type { LucideIcon } from "lucide-react";
import {
  ArrowLeftRight,
  BadgeCheck,
  CalendarDays,
  ClipboardList,
  Compass,
  FileSearch,
  Mail,
  Plane,
  Route,
  Search,
  Ticket,
  UserRound,
  Users,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
};

export const NAV_BY_ROLE: Record<string, NavItem[]> = {
  HRD_MANAGER: [
    { href: "/hrd/cuti", label: "Daftar Pengajuan Cuti", icon: CalendarDays },
    { href: "/hrd/pegawai", label: "Riwayat & Hak Cuti", icon: Users },
  ],
  PASSENGER: [
    { href: "/penerbangan", label: "Cari Penerbangan", icon: Search, exact: true },
    { href: "/penerbangan/bandingkan", label: "Bandingkan Tujuan", icon: ArrowLeftRight },
    { href: "/pulang-pergi", label: "Pulang-Pergi", icon: Compass },
    { href: "/pemesanan", label: "Pemesanan Saya", icon: ClipboardList },
  ],
  MEMBER: [
    { href: "/member/penerbangan", label: "Cari & Bandingkan", icon: Search },
    { href: "/member/pencarian-multi", label: "Multi-Destinasi", icon: Route },
    { href: "/member/rencana", label: "Rencana Perjalanan", icon: Compass },
    { href: "/member/profil", label: "Profil Saya", icon: UserRound },
    { href: "/member/validasi", label: "Validasi Tiket", icon: BadgeCheck },
    { href: "/pemesanan", label: "Pemesanan Saya", icon: ClipboardList },
  ],
  TRAVEL_MANAGER: [
    { href: "/travel/pemesanan", label: "Status Pemesanan", icon: ClipboardList },
    { href: "/travel/cari", label: "Pesan untuk Pengunjung", icon: Plane },
    { href: "/travel/verifikasi", label: "Verifikasi Booking", icon: FileSearch },
    { href: "/dev/email", label: "Email Outbox", icon: Mail },
  ],
  VISITOR: [{ href: "/tiket-saya", label: "Tiket Saya", icon: Ticket }],
};

export function navForRole(role: string): NavItem[] {
  return NAV_BY_ROLE[role] ?? [];
}
