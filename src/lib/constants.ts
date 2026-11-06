export const APP_NAME = "TravelKu";
export const APP_TAGLINE = "Sistem Informasi Perjalanan & Manajemen Cuti";

export const MESSAGES = {
  PROFILE_INCOMPLETE: "Data profil tidak lengkap",
  BOOKING_REFERENCE_INVALID: "Kode booking reference tidak sesuai",
  RETURN_BEFORE_DEPARTURE:
    "Tanggal kepulangan tidak boleh lebih awal daripada tanggal keberangkatan",
  NO_FLIGHTS: "Penerbangan tidak tersedia untuk kriteria yang dipilih",
  LOGIN_INVALID: "Email atau kata sandi tidak sesuai",
  UNAUTHORIZED: "Anda tidak memiliki akses ke halaman ini",
  REQUIRED_FIELDS: "Lengkapi seluruh data wajib terlebih dahulu",
} as const;

export const ROLES = {
  HRD_MANAGER: "HRD_MANAGER",
  PASSENGER: "PASSENGER",
  MEMBER: "MEMBER",
  TRAVEL_MANAGER: "TRAVEL_MANAGER",
  VISITOR: "VISITOR",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const ROLE_LABELS: Record<string, string> = {
  HRD_MANAGER: "Manajer HRD",
  PASSENGER: "Calon Penumpang",
  MEMBER: "Member Frequent Traveller",
  TRAVEL_MANAGER: "Manajer Travel",
  VISITOR: "Pengunjung",
};

export const BOOKING_STATUS = {
  WAITING_FOR_PAYMENT: "WAITING_FOR_PAYMENT",
  BOOKED: "BOOKED",
  CONFIRMED: "CONFIRMED",
  CANCELLED: "CANCELLED",
} as const;

export const BOOKING_STATUS_LABELS: Record<string, string> = {
  WAITING_FOR_PAYMENT: "Waiting for Payment",
  BOOKED: "Booked",
  CONFIRMED: "Confirmed",
  CANCELLED: "Cancelled",
};

export const LEAVE_STATUS_LABELS: Record<string, string> = {
  APPROVED: "Disetujui",
  PENDING: "Menunggu",
  REJECTED: "Ditolak",
};

export const BOOKING_STATUSES = [
  BOOKING_STATUS.CONFIRMED,
  BOOKING_STATUS.BOOKED,
  BOOKING_STATUS.WAITING_FOR_PAYMENT,
] as const;
