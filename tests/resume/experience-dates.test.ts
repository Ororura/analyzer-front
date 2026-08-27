import { describe, expect, it } from "vitest";
import {
  calculateExperienceDurationMonths,
  calculateExperiencePeriod,
  normalizeExperienceDate,
} from "@/lib/resume/experience-dates";

const currentDate = new Date(2026, 7, 27);

describe("experience dates", () => {
  it("calculates a current period without treating its start as future", () => {
    expect(calculateExperiencePeriod({ startDate: "2025-05", endDate: "present" }, currentDate)).toEqual({
      startDate: "2025-05",
      endDate: "present",
      durationMonths: 15,
      isFuture: false,
      isCurrent: true,
    });
  });

  it("detects a future start date", () => {
    expect(calculateExperiencePeriod({ startDate: "2027-05", endDate: "present" }, currentDate)).toMatchObject({
      durationMonths: null,
      isFuture: true,
      isCurrent: true,
    });
  });

  it("calculates duration between month-precision dates", () => {
    expect(calculateExperienceDurationMonths([{ startDate: "2025-05", endDate: "2026-08" }], currentDate)).toBe(
      15,
    );
  });

  it("keeps an unknown start unknown without fabricating a value", () => {
    expect(calculateExperiencePeriod({ startDate: null, endDate: "present" }, currentDate)).toEqual({
      startDate: null,
      endDate: "present",
      durationMonths: null,
      isFuture: null,
      isCurrent: true,
    });
  });

  it("uses the supplied current date as the effective present end", () => {
    const present = calculateExperiencePeriod({ startDate: "2026-05", endDate: "current" }, currentDate);
    expect(present).toMatchObject({ endDate: "present", durationMonths: 3, isCurrent: true });
  });

  it("preserves month precision while normalizing known aliases", () => {
    expect(normalizeExperienceDate("2025-05")).toBe("2025-05");
    expect(normalizeExperienceDate("настоящее время")).toBe("present");
  });
});
