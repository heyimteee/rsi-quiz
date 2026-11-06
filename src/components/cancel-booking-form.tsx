"use client";

import { useFormStatus } from "react-dom";
import { LoaderCircle, XCircle } from "lucide-react";
import { cancelBookingAction } from "@/lib/actions/booking-actions";

function CancelButton({ label, className }: { label: string; className?: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={className ?? "btn-danger"}
      onClick={(event) => {
        const confirmed = window.confirm(
          "Batalkan pemesanan ini? Kursi akan dilepas dan status pemesanan berubah menjadi Cancelled.",
        );
        if (!confirmed) event.preventDefault();
      }}
    >
      {pending ? (
        <>
          <LoaderCircle className="size-4 animate-spin" aria-hidden />
          Membatalkan…
        </>
      ) : (
        <>
          <XCircle className="size-4" aria-hidden />
          {label}
        </>
      )}
    </button>
  );
}

export function CancelBookingForm({
  bookingId,
  redirectTo = "detail",
  label = "Batalkan pemesanan",
  className,
}: {
  bookingId: string;
  redirectTo?: "detail" | "list";
  label?: string;
  className?: string;
}) {
  return (
    <form action={cancelBookingAction} data-testid="cancel-booking-form">
      <input type="hidden" name="bookingId" value={bookingId} />
      <input type="hidden" name="redirectTo" value={redirectTo} />
      <CancelButton label={label} className={className} />
    </form>
  );
}
