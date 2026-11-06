import { AlertCircle, CheckCircle2, Info, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

type AlertVariant = "error" | "success" | "info" | "warning";

const styles: Record<AlertVariant, string> = {
  error: "border-red-200 bg-red-soft text-red-900",
  success: "border-emerald-200 bg-green-soft text-emerald-900",
  info: "border-sky/25 bg-sky-soft text-navy",
  warning: "border-amber-200 bg-amber-soft text-amber-900",
};

const icons = {
  error: AlertCircle,
  success: CheckCircle2,
  info: Info,
  warning: TriangleAlert,
};

export function Alert({
  variant = "info",
  title,
  children,
  className,
}: {
  variant?: AlertVariant;
  title?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  const Icon = icons[variant];
  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className={cn("flex gap-3 rounded-xl border p-3.5 text-sm", styles[variant], className)}
    >
      <Icon className="mt-0.5 size-4.5 shrink-0" aria-hidden />
      <div className="min-w-0">
        {title ? <p className="font-semibold">{title}</p> : null}
        {children ? <div className={cn("leading-relaxed", title && "mt-0.5")}>{children}</div> : null}
      </div>
    </div>
  );
}
