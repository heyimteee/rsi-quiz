import { BOOKING_STATUS_LABELS, LEAVE_STATUS_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";

const bookingStyles: Record<string, string> = {
  CONFIRMED: "bg-green-soft text-emerald-800",
  BOOKED: "bg-sky-soft text-sky-800",
  WAITING_FOR_PAYMENT: "bg-amber-soft text-amber-800",
  CANCELLED: "bg-red-soft text-red-700",
};

const leaveStyles: Record<string, string> = {
  APPROVED: "bg-green-soft text-emerald-800",
  PENDING: "bg-amber-soft text-amber-800",
  REJECTED: "bg-red-soft text-red-700",
};

export function StatusBadge({
  status,
  kind = "booking",
  className,
}: {
  status: string;
  kind?: "booking" | "leave";
  className?: string;
}) {
  const label =
    kind === "booking"
      ? (BOOKING_STATUS_LABELS[status] ?? status)
      : (LEAVE_STATUS_LABELS[status] ?? status);
  const style = (kind === "booking" ? bookingStyles : leaveStyles)[status] ?? "bg-canvas text-muted";
  return <span className={cn("badge", style, className)}>{label}</span>;
}

export function CountBadge({
  children,
  active = false,
}: {
  children: React.ReactNode;
  active?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex min-w-6 items-center justify-center rounded-full px-1.5 py-0.5 text-[11px] font-bold",
        active ? "bg-white/20 text-white" : "bg-canvas text-muted",
      )}
    >
      {children}
    </span>
  );
}
