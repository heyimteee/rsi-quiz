import { z } from "zod";
import { parseDateOnly } from "@/lib/utils";

export const identitySchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(3, "Nama lengkap minimal 3 karakter")
    .max(100, "Nama lengkap maksimal 100 karakter"),
  nik: z.string().trim().regex(/^\d{16}$/, "NIK harus terdiri dari 16 digit angka"),
  phone: z
    .string()
    .trim()
    .refine((value) => {
      const digits = value.replace(/\D/g, "");
      return digits.length >= 9 && digits.length <= 15;
    }, "Nomor telepon harus terdiri dari 9–15 digit"),
  birthDate: z
    .string()
    .trim()
    .refine((value) => parseDateOnly(value) !== null, "Tanggal lahir tidak valid"),
});

export type IdentityFormInput = z.infer<typeof identitySchema>;

export function fieldErrorsFromZod(error: z.ZodError): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!fieldErrors[key]) fieldErrors[key] = issue.message;
  }
  return fieldErrors;
}

export function parseIdentityFormData(formData: FormData):
  | { success: true; data: IdentityFormInput }
  | { success: false; fieldErrors: Record<string, string> } {
  const result = identitySchema.safeParse({
    fullName: formData.get("fullName"),
    nik: formData.get("nik"),
    phone: formData.get("phone"),
    birthDate: formData.get("birthDate"),
  });
  if (!result.success) {
    return { success: false, fieldErrors: fieldErrorsFromZod(result.error) };
  }
  return { success: true, data: result.data };
}
