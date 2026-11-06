"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import { BookingError, createBooking } from "@/lib/services/booking-service";
import { getVisitorById } from "@/lib/services/travel-service";

export type VisitorBookingState = {
  error?: string;
};

export async function bookForVisitorAction(
  _prevState: VisitorBookingState,
  formData: FormData,
): Promise<VisitorBookingState> {
  const manager = await requireRole("TRAVEL_MANAGER");
  const visitorId = String(formData.get("visitorId") ?? "");
  const flightId = String(formData.get("flightId") ?? "");
  if (!visitorId) return { error: "Pilih pengunjung terlebih dahulu" };
  if (!flightId) return { error: "Penerbangan belum dipilih" };

  const visitor = await getVisitorById(visitorId);
  if (!visitor) return { error: "Data pengunjung tidak ditemukan" };

  let bookingId: string;
  try {
    const booking = await createBooking({
      bookerId: manager.id,
      passengerId: visitor.id,
      tripType: "ONE_WAY",
      segments: [{ flightId, leg: "OUTBOUND", sequence: 1 }],
    });
    bookingId = booking.id;
  } catch (error) {
    if (error instanceof BookingError) return { error: error.message };
    console.error("bookForVisitorAction failed", error);
    return { error: "Terjadi kesalahan saat memproses pemesanan pengunjung" };
  }

  revalidatePath("/travel/pemesanan");
  revalidatePath("/tiket-saya");
  revalidatePath("/dev/email");
  redirect(`/travel/pemesanan/${bookingId}?baru=1`);
}
