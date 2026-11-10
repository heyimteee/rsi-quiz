import { MESSAGES } from "@/lib/constants";

export type ProfileLike = {
  fullName?: string | null;
  nik?: string | null;
  phone?: string | null;
  birthDate?: Date | string | null;
  passportNumber?: string | null;
};

export const REQUIRED_PROFILE_FIELDS = [
  { key: "fullName", label: "Nama lengkap" },
  { key: "nik", label: "NIK" },
  { key: "phone", label: "Nomor telepon" },
  { key: "birthDate", label: "Tanggal lahir" },
] as const;

export type ProfileCompleteness = {
  complete: boolean;
  missingFields: string[];
  missingLabels: string[];
};

function isFilled(value: string | null | undefined): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

function isValidBirthDate(value: string | Date | null | undefined): boolean {
  if (value instanceof Date) return !Number.isNaN(value.getTime());
  if (typeof value !== "string") return false;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

export function isProfileFieldValid(
  key: (typeof REQUIRED_PROFILE_FIELDS)[number]["key"],
  value: string | Date | null | undefined,
): boolean {
  if (key === "birthDate") {
    return isValidBirthDate(value);
  }
  if (key === "nik") {
    return isFilled(value as string) && /^\d{16}$/.test((value as string).trim());
  }
  if (key === "phone") {
    const digits = String(value ?? "").replace(/\D/g, "");
    return digits.length >= 9 && digits.length <= 15;
  }
  return isFilled(value as string);
}

export function checkProfileCompleteness(profile: ProfileLike | null | undefined): ProfileCompleteness {
  if (!profile) {
    return {
      complete: false,
      missingFields: REQUIRED_PROFILE_FIELDS.map((field) => field.key),
      missingLabels: REQUIRED_PROFILE_FIELDS.map((field) => field.label),
    };
  }

  const missingFields: string[] = [];
  const missingLabels: string[] = [];

  for (const field of REQUIRED_PROFILE_FIELDS) {
    if (!isProfileFieldValid(field.key, profile[field.key])) {
      missingFields.push(field.key);
      missingLabels.push(field.label);
    }
  }

  return {
    complete: missingFields.length === 0,
    missingFields,
    missingLabels,
  };
}

export function validateTicket(
  profile: ProfileLike | null | undefined,
  ticketExists: boolean,
): { status: "VALID" | "REJECTED"; message: string; missingLabels?: string[] } {
  if (!ticketExists) {
    return { status: "REJECTED", message: "Tiket tidak ditemukan" };
  }
  const completeness = checkProfileCompleteness(profile);
  if (!completeness.complete) {
    return {
      status: "REJECTED",
      message: MESSAGES.PROFILE_INCOMPLETE,
      missingLabels: completeness.missingLabels,
    };
  }
  return { status: "VALID", message: "Tiket berhasil divalidasi" };
}
