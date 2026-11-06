"use client";

import { useFormStatus } from "react-dom";
import { LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export function SubmitButton({
  children,
  className,
  pendingLabel,
  variant = "primary",
  name,
  value,
  formNoValidate,
}: {
  children: React.ReactNode;
  className?: string;
  pendingLabel?: string;
  variant?: "primary" | "secondary" | "danger";
  name?: string;
  value?: string;
  formNoValidate?: boolean;
}) {
  const { pending } = useFormStatus();
  const variants = {
    primary: "btn-primary",
    secondary: "btn-secondary",
    danger: "btn-danger",
  };
  return (
    <button
      type="submit"
      name={name}
      value={value}
      formNoValidate={formNoValidate}
      disabled={pending}
      className={cn(variants[variant], className)}
    >
      {pending ? (
        <>
          <LoaderCircle className="size-4 animate-spin" aria-hidden />
          {pendingLabel ?? "Memproses…"}
        </>
      ) : (
        children
      )}
    </button>
  );
}
