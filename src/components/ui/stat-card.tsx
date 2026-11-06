import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  icon?: LucideIcon;
  tone?: "default" | "sky" | "green" | "amber" | "red";
}) {
  const tones = {
    default: "bg-navy text-white",
    sky: "bg-sky-soft text-sky",
    green: "bg-green-soft text-emerald-700",
    amber: "bg-amber-soft text-amber-700",
    red: "bg-red-soft text-red-600",
  };
  return (
    <div className="card p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
        {Icon ? (
          <span className={cn("flex size-8 items-center justify-center rounded-lg", tones[tone])}>
            <Icon className="size-4" aria-hidden />
          </span>
        ) : null}
      </div>
      <p className="mt-2 text-2xl font-extrabold tracking-tight">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
    </div>
  );
}
