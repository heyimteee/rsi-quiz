import { describe, expect, it } from "vitest";
import { identitySchema, fieldErrorsFromZod, parseIdentityFormData } from "@/lib/validation/booking";

describe("identitySchema", () => {
  const valid = {
    fullName: "Dimas Nugroho",
    nik: "3171031103900003",
    phone: "081311112222",
    birthDate: "1990-03-11",
  };

  it("menerima identitas lengkap", () => {
    expect(identitySchema.safeParse(valid).success).toBe(true);
  });

  it("menolak nama terlalu pendek", () => {
    const result = identitySchema.safeParse({ ...valid, fullName: "Di" });
    expect(result.success).toBe(false);
  });

  it("menolak NIK kurang dari 16 digit", () => {
    const result = identitySchema.safeParse({ ...valid, nik: "123" });
    expect(result.success).toBe(false);
  });

  it("menolak nomor telepon terlalu pendek atau terlalu panjang", () => {
    expect(identitySchema.safeParse({ ...valid, phone: "123" }).success).toBe(false);
    expect(identitySchema.safeParse({ ...valid, phone: "1234567890123456" }).success).toBe(false);
  });

  it("menolak tanggal lahir tidak valid", () => {
    expect(identitySchema.safeParse({ ...valid, birthDate: "2026-02-31" }).success).toBe(false);
    expect(identitySchema.safeParse({ ...valid, birthDate: "31-12-1990" }).success).toBe(false);
  });

  it("mengubah error Zod menjadi field errors", () => {
    const result = identitySchema.safeParse({ ...valid, nik: "1", phone: "x" });
    expect(result.success).toBe(false);
    if (result.success) return;
    const errors = fieldErrorsFromZod(result.error);
    expect(errors.nik).toContain("16 digit");
    expect(errors.phone).toContain("9–15 digit");
  });
});

describe("parseIdentityFormData", () => {
  it("mengembalikan data valid dari FormData", () => {
    const data = new FormData();
    data.set("fullName", "Dimas Nugroho");
    data.set("nik", "3171031103900003");
    data.set("phone", "081311112222");
    data.set("birthDate", "1990-03-11");
    const result = parseIdentityFormData(data);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.fullName).toBe("Dimas Nugroho");
  });

  it("mengembalikan fieldErrors untuk data tidak valid", () => {
    const data = new FormData();
    data.set("fullName", "");
    data.set("nik", "abc");
    data.set("phone", "");
    data.set("birthDate", "");
    const result = parseIdentityFormData(data);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(Object.keys(result.fieldErrors).length).toBeGreaterThanOrEqual(4);
    }
  });
});
