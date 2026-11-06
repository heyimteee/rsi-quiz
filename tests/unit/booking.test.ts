import { describe, expect, it } from "vitest";
import {
  calculateTotalPrice,
  canCancelBooking,
  filterBookingsByStatus,
  normalizeBookingReference,
  validateBookingReference,
  validateReturnDate,
  validateTripCriteria,
} from "@/lib/domain/booking";
import { MESSAGES } from "@/lib/constants";

describe("validateReturnDate", () => {
  it("menolak tanggal kepulangan sebelum keberangkatan", () => {
    const result = validateReturnDate(new Date(2026, 10, 10), new Date(2026, 10, 9));
    expect(result.valid).toBe(false);
    expect(result.message).toBe(MESSAGES.RETURN_BEFORE_DEPARTURE);
  });

  it("mengizinkan tanggal kepulangan sama dengan keberangkatan", () => {
    expect(validateReturnDate(new Date(2026, 10, 10), new Date(2026, 10, 10)).valid).toBe(true);
  });

  it("mengizinkan tanggal kepulangan setelah keberangkatan", () => {
    expect(validateReturnDate(new Date(2026, 10, 10), new Date(2026, 10, 12)).valid).toBe(true);
  });

  it("menolak input kosong", () => {
    expect(validateReturnDate(null, new Date(2026, 10, 12)).valid).toBe(false);
    expect(validateReturnDate(new Date(2026, 10, 12), null).valid).toBe(false);
  });
});

describe("validateTripCriteria", () => {
  it("menolak rute dengan asal dan tujuan sama", () => {
    const result = validateTripCriteria({ originCode: "CGK", destinationCode: "CGK" });
    expect(result.valid).toBe(false);
  });

  it("menerima rute berbeda", () => {
    expect(validateTripCriteria({ originCode: "CGK", destinationCode: "DPS" }).valid).toBe(true);
  });
});

describe("booking helpers", () => {
  const bookings = [
    { id: "1", referenceCode: "TRV-DEMO01", status: "CONFIRMED", totalPrice: 100, createdAt: new Date() },
    { id: "2", referenceCode: "TRV-DEMO02", status: "BOOKED", totalPrice: 200, createdAt: new Date() },
    { id: "3", referenceCode: "TRV-DEMO03", status: "WAITING_FOR_PAYMENT", totalPrice: 300, createdAt: new Date() },
  ];

  it("menjumlahkan total harga", () => {
    expect(calculateTotalPrice([{ price: 125000 }, { price: 75000 }])).toBe(200000);
    expect(calculateTotalPrice([])).toBe(0);
  });

  it("memfilter status pemesanan", () => {
    expect(filterBookingsByStatus(bookings, "CONFIRMED")).toHaveLength(1);
    expect(filterBookingsByStatus(bookings, "semua")).toHaveLength(3);
    expect(filterBookingsByStatus(bookings, "UNKNOWN")).toHaveLength(0);
  });

  it("menormalisasi kode booking", () => {
    expect(normalizeBookingReference("  trv-demo01 ")).toBe("TRV-DEMO01");
  });

  it("memvalidasi kode booking tanpa membedakan kapital", () => {
    const result = validateBookingReference(" trv-demo02 ", bookings);
    expect(result.valid).toBe(true);
    expect(result.booking?.id).toBe("2");
  });

  it("menolak kode booking yang tidak ditemukan", () => {
    expect(validateBookingReference("TRV-SALAH", bookings).valid).toBe(false);
    expect(validateBookingReference("", bookings).valid).toBe(false);
  });

  it("menentukan kelayakan pembatalan", () => {
    const now = new Date(2026, 10, 1);
    expect(canCancelBooking({ status: "CONFIRMED", departureAt: new Date(2026, 10, 2) }, now)).toBe(true);
    expect(canCancelBooking({ status: "CANCELLED", departureAt: new Date(2026, 10, 2) }, now)).toBe(false);
    expect(canCancelBooking({ status: "CONFIRMED", departureAt: new Date(2026, 9, 30) }, now)).toBe(false);
  });
});
