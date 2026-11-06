"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import { parseDateOnly } from "@/lib/utils";
import { parseIdentityFormData } from "@/lib/validation/booking";
import { updatePassengerProfile } from "@/lib/services/booking-service";
import {
  MemberError,
  validateMemberTicket,
} from "@/lib/services/member-service";
import {
  ItineraryError,
  addItinerarySegment,
  createItinerary,
  type ItinerarySegmentInput,
} from "@/lib/services/itinerary-service";

export type ProfileActionState = {
  error?: string;
  success?: string;
  fieldErrors?: Record<string, string>;
};

export async function updateProfileAction(
  _prevState: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const user = await requireRole("MEMBER");
  const parsed = parseIdentityFormData(formData);
  if (!parsed.success) return { fieldErrors: parsed.fieldErrors };

  const birthDate = parseDateOnly(parsed.data.birthDate);
  if (!birthDate) return { fieldErrors: { birthDate: "Tanggal lahir tidak valid" } };

  const passportNumber = String(formData.get("passportNumber") ?? "").trim();
  if (passportNumber.length > 20) {
    return { fieldErrors: { passportNumber: "Nomor paspor maksimal 20 karakter" } };
  }

  await updatePassengerProfile(user.id, {
    fullName: parsed.data.fullName,
    nik: parsed.data.nik,
    phone: parsed.data.phone,
    birthDate,
    passportNumber: passportNumber || null,
  });

  revalidatePath("/member/profil");
  revalidatePath("/member/validasi");
  return { success: "Data profil berhasil diperbarui" };
}

export type ValidationActionState = {
  error?: string;
  status?: "VALID" | "REJECTED";
  message?: string;
  missingLabels?: string[];
  alreadyValid?: boolean;
  reference?: string;
};

export async function validateTicketAction(
  _prevState: ValidationActionState,
  formData: FormData,
): Promise<ValidationActionState> {
  const user = await requireRole("MEMBER");
  const bookingId = String(formData.get("bookingId") ?? "");
  if (!bookingId) return { error: "Pilih tiket yang ingin divalidasi" };

  try {
    const result = await validateMemberTicket(user.id, bookingId);
    revalidatePath("/member/validasi");
    revalidatePath(`/pemesanan/${bookingId}`);
    return {
      status: result.status,
      message: result.message,
      missingLabels: result.missingLabels,
      alreadyValid: result.alreadyValid,
      reference: result.booking.referenceCode,
    };
  } catch (error) {
    if (error instanceof MemberError) return { error: error.message };
    console.error("validateTicketAction failed", error);
    return { error: "Terjadi kesalahan saat memvalidasi tiket" };
  }
}

export type ItineraryActionState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  success?: string;
};

function parseSegments(formData: FormData):
  | { success: true; segments: ItinerarySegmentInput[] }
  | { success: false; error: string; fieldErrors?: Record<string, string> } {
  const origins = formData.getAll("origin").map((value) => String(value));
  const destinations = formData.getAll("destination").map((value) => String(value));
  const dates = formData.getAll("departureDate").map((value) => String(value));
  const length = Math.max(origins.length, destinations.length, dates.length);
  const segments: ItinerarySegmentInput[] = [];

  for (let index = 0; index < length; index++) {
    const originId = origins[index] ?? "";
    const destinationId = destinations[index] ?? "";
    const dateValue = dates[index] ?? "";
    const anyFilled = originId || destinationId || dateValue;
    if (!anyFilled) continue;
    if (!originId || !destinationId || !dateValue) {
      return {
        success: false,
        error: `Rute ${index + 1}: kota asal, tujuan, dan tanggal harus diisi lengkap`,
        fieldErrors: { [`segment-${index}`]: "Data rute belum lengkap" },
      };
    }
    if (originId === destinationId) {
      return {
        success: false,
        error: `Rute ${index + 1}: kota asal dan tujuan tidak boleh sama`,
      };
    }
    const departureDate = parseDateOnly(dateValue);
    if (!departureDate) {
      return { success: false, error: `Rute ${index + 1}: tanggal tidak valid` };
    }
    if (segments.length > 0 && departureDate < segments[segments.length - 1].departureDate) {
      return {
        success: false,
        error: "Tanggal rute lanjutan tidak boleh lebih awal daripada rute sebelumnya",
      };
    }
    segments.push({ originId, destinationId, departureDate });
  }

  if (segments.length === 0) {
    return { success: false, error: "Tambahkan minimal satu rute perjalanan" };
  }
  return { success: true, segments };
}

export async function createItineraryAction(
  _prevState: ItineraryActionState,
  formData: FormData,
): Promise<ItineraryActionState> {
  const user = await requireRole("MEMBER");
  const name = String(formData.get("name") ?? "").trim();
  if (name.length < 3) return { fieldErrors: { name: "Nama rencana minimal 3 karakter" } };

  const parsed = parseSegments(formData);
  if (!parsed.success) return { error: parsed.error, fieldErrors: parsed.fieldErrors };

  let itineraryId: string;
  try {
    const itinerary = await createItinerary(user.id, name, parsed.segments);
    itineraryId = itinerary.id;
  } catch (error) {
    if (error instanceof ItineraryError) return { error: error.message };
    console.error("createItineraryAction failed", error);
    return { error: "Terjadi kesalahan saat menyimpan rencana perjalanan" };
  }

  revalidatePath("/member/rencana");
  redirect(`/member/rencana/${itineraryId}?baru=1`);
}

export async function addItinerarySegmentAction(
  _prevState: ItineraryActionState,
  formData: FormData,
): Promise<ItineraryActionState> {
  const user = await requireRole("MEMBER");
  const itineraryId = String(formData.get("itineraryId") ?? "");
  const originId = String(formData.get("origin") ?? "");
  const destinationId = String(formData.get("destination") ?? "");
  const departureDate = parseDateOnly(String(formData.get("departureDate") ?? ""));

  if (!originId || !destinationId || !departureDate) {
    return { error: "Lengkapi kota asal, tujuan, dan tanggal rute lanjutan" };
  }
  if (originId === destinationId) {
    return { error: "Kota asal dan tujuan tidak boleh sama" };
  }

  try {
    await addItinerarySegment(itineraryId, user.id, {
      originId,
      destinationId,
      departureDate,
    });
  } catch (error) {
    if (error instanceof ItineraryError) return { error: error.message };
    console.error("addItinerarySegmentAction failed", error);
    return { error: "Terjadi kesalahan saat menambahkan rute" };
  }

  revalidatePath(`/member/rencana/${itineraryId}`);
  redirect(`/member/rencana/${itineraryId}?sukses=1`);
}
