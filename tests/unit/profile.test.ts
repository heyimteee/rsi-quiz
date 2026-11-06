import { describe, expect, it } from "vitest";
import { checkProfileCompleteness, validateTicket } from "@/lib/domain/profile";
import { MESSAGES } from "@/lib/constants";

const completeProfile = {
  fullName: "Dimas Nugroho",
  nik: "3171031103900003",
  phone: "081311112222",
  birthDate: new Date(1990, 2, 11),
};

describe("checkProfileCompleteness", () => {
  it("menyatakan profil lengkap", () => {
    expect(checkProfileCompleteness(completeProfile)).toEqual({
      complete: true,
      missingFields: [],
      missingLabels: [],
    });
  });

  it("mendeteksi NIK dan tanggal lahir yang kosong", () => {
    const result = checkProfileCompleteness({
      fullName: "Laras Wijaya",
      nik: null,
      phone: "081399998888",
      birthDate: null,
    });
    expect(result.complete).toBe(false);
    expect(result.missingFields).toEqual(["nik", "birthDate"]);
    expect(result.missingLabels).toEqual(["NIK", "Tanggal lahir"]);
  });

  it("mendeteksi NIK dengan format salah", () => {
    const result = checkProfileCompleteness({ ...completeProfile, nik: "123" });
    expect(result.complete).toBe(false);
    expect(result.missingFields).toContain("nik");
  });

  it("menangani profil null", () => {
    expect(checkProfileCompleteness(null).missingFields).toHaveLength(4);
  });
});

describe("validateTicket", () => {
  it("menolak validasi jika profil tidak lengkap dengan pesan yang persis", () => {
    const result = validateTicket({ fullName: "Laras Wijaya", nik: null }, true);
    expect(result.status).toBe("REJECTED");
    expect(result.message).toBe(MESSAGES.PROFILE_INCOMPLETE);
    expect(result.missingLabels).toContain("NIK");
  });

  it("menerima validasi jika profil lengkap", () => {
    const result = validateTicket(completeProfile, true);
    expect(result.status).toBe("VALID");
  });

  it("menolak jika tiket tidak ditemukan", () => {
    expect(validateTicket(completeProfile, false).status).toBe("REJECTED");
  });
});
