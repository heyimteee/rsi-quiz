"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole, requireUser } from "@/lib/auth/session";
import { parseDateOnly } from "@/lib/utils";
import { parseIdentityFormData } from "@/lib/validation/booking";
import {
  BookingError,
  cancelBooking,
  createBooking,
  updatePassengerProfile,
} from "@/lib/services/booking-service";
import { MESSAGES } from "@/lib/constants";

export type BookingActionState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

async function saveIdentity(userId: string, formData: FormData) {
  const parsed = parseIdentityFormData(formData);
  if (!parsed.success) {
    return { success: false as const, state: { fieldErrors: parsed.fieldErrors } };
  }
  const birthDate = parseDateOnly(parsed.data.birthDate);
  if (!birthDate) {
    return {
      success: false as const,
      state: { fieldErrors: { birthDate: "Tanggal lahir tidak valid" } },
    };
  }
  await updatePassengerProfile(userId, {
    fullName: parsed.data.fullName,
    nik: parsed.data.nik,
    phone: parsed.data.phone,
    birthDate,
  });
  return { success: true as const };
}

export async function bookFlightAction(
  _prevState: BookingActionState,
  formData: FormData,
): Promise<BookingActionState> {
  const user = await requireRole(["PASSENGER", "MEMBER"]);
  const flightId = String(formData.get("flightId") ?? "");
  if (!flightId) return { error: "Penerbangan belum dipilih" };

  const identity = await saveIdentity(user.id, formData);
  if (!identity.success) return identity.state;

  let bookingId: string;
  try {
    const booking = await createBooking({
      bookerId: user.id,
      passengerId: user.id,
      tripType: "ONE_WAY",
      segments: [{ flightId, leg: "OUTBOUND", sequence: 1 }],
    });
    bookingId = booking.id;
  } catch (error) {
    if (error instanceof BookingError) return { error: error.message };
    console.error("bookFlightAction failed", error);
    return { error: "Terjadi kesalahan saat memproses pemesanan. Silakan coba lagi." };
  }

  revalidatePath("/pemesanan");
  redirect(`/pemesanan/${bookingId}?baru=1`);
}

export async function bookRoundTripAction(
  _prevState: BookingActionState,
  formData: FormData,
): Promise<BookingActionState> {
  const user = await requireRole(["PASSENGER", "MEMBER"]);
  const outboundId = String(formData.get("outboundId") ?? "");
  const returnId = String(formData.get("returnId") ?? "");
  if (!outboundId || !returnId) return { error: MESSAGES.NO_FLIGHTS };

  const identity = await saveIdentity(user.id, formData);
  if (!identity.success) return identity.state;

  let bookingId: string;
  try {
    const booking = await createBooking({
      bookerId: user.id,
      passengerId: user.id,
      tripType: "ROUND_TRIP",
      segments: [
        { flightId: outboundId, leg: "OUTBOUND", sequence: 1 },
        { flightId: returnId, leg: "RETURN", sequence: 2 },
      ],
    });
    bookingId = booking.id;
  } catch (error) {
    if (error instanceof BookingError) return { error: error.message };
    console.error("bookRoundTripAction failed", error);
    return { error: "Terjadi kesalahan saat memproses pemesanan. Silakan coba lagi." };
  }

  revalidatePath("/pemesanan");
  redirect(`/pemesanan/${bookingId}?baru=1&pp=1`);
}

export async function cancelBookingAction(formData: FormData) {
  const user = await requireUser();
  const bookingId = String(formData.get("bookingId") ?? "");
  const redirectTo = String(formData.get("redirectTo") ?? "detail");
  const target = redirectTo === "list" ? "/pemesanan" : `/pemesanan/${bookingId}`;

  if (!bookingId) redirect("/pemesanan?gagal=Pemesanan%20tidak%20ditemukan");

  try {
    await cancelBooking(bookingId, user.id);
  } catch (error) {
    const message =
      error instanceof BookingError
        ? error.message
        : "Terjadi kesalahan saat membatalkan pemesanan";
    revalidatePath("/pemesanan");
    redirect(`${target}?gagal=${encodeURIComponent(message)}`);
  }

  revalidatePath("/pemesanan");
  redirect(`${target}?dibatalkan=1`);
}
