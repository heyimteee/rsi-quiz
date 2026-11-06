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
    const value = profile[field.key];
    let valid = false;
    if (field.key === "birthDate") {
      valid = Boolean(value) && !Number.isNaN(new Date(value as string).getTime());
    } else if (field.key === "nik") {
      valid = isFilled(value as string) && /^\d{16}$/.test((value as string).trim());
    } else if (field.key === "phone") {
      const digits = String(value ?? "").replace(/\D/g, "");
      valid = digits.length >= 9 && digits.length <= 15;
    } else {
      valid = isFilled(value as string);
    }
    if (!valid) {
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
