import { describe, expect, it } from "vitest";
import { RawAtsAnalysisSchema } from "@/lib/analysis/schema";
import {
  calculateAtsScore,
  calculateKeywordCoverage,
  calculateStructuredFiltersScore,
  clampScore,
  finalizeAtsAnalysis,
} from "@/lib/ats/scorer";
import { createBaselineMarketData } from "@/lib/ats/market-data";
import { validFinalAtsAnalysis } from "../fixtures/analysis";

const raw = () => RawAtsAnalysisSchema.parse(structuredClone(validFinalAtsAnalysis));

describe("ATS scoring", () => {
  it("calculates the weighted ATS score in application code", () => {
    expect(
      calculateAtsScore({
        hhSearchMatch: 80,
        hhStructuredFilters: 70,
        vacancyMatch: 60,
        keywordCoverage: 90,
        recruiterReadability: 100,
      }),
    ).toBe(78);
  });
  it("keeps every calculated score inside 0..100", () => {
    expect(clampScore(-50)).toBe(0);
    expect(clampScore(149)).toBe(100);
  });
  it("excludes unknown filters and uses 50 when every filter is unknown", () => {
    const analysis = raw();
    expect(calculateStructuredFiltersScore(analysis.structuredFilters)).toBe(100);
    for (const filter of Object.values(analysis.structuredFilters))
      Object.assign(filter, { status: "unknown", evidence: null });
    expect(calculateStructuredFiltersScore(analysis.structuredFilters)).toBe(50);
  });
  it("does not materially punish a Junior for missing Kafka and Kubernetes", () => {
    const analysis = raw();
    const withoutBonus = analysis.technologies.filter((item) => !["Kafka", "Kubernetes"].includes(item.technology));
    expect(
      Math.abs(
        calculateKeywordCoverage(analysis.technologies, "junior") - calculateKeywordCoverage(withoutBonus, "junior"),
      ),
    ).toBeLessThanOrEqual(3);
  });
  it("credits Skills-only lower than experience-confirmed technology", () => {
    const analysis = raw();
    const skillsOnly = analysis.technologies.map((item) =>
      item.technology === "Java" ? { ...item, status: "skills_only" as const } : item,
    );
    expect(calculateKeywordCoverage(analysis.technologies, analysis.detectedLevel)).toBeGreaterThan(
      calculateKeywordCoverage(skillsOnly, analysis.detectedLevel),
    );
  });
  it("preserves other-language backend experience separately from Java experience", () => {
    const result = finalizeAtsAnalysis(raw(), createBaselineMarketData());
    expect(result.experience.backendExperience.value).toBe("1 год 6 месяцев");
    expect(result.experience.relevantJavaExperience.value).toBe("6 месяцев");
    expect(result.experience.backendExperience.value).not.toBe(result.experience.relevantJavaExperience.value);
  });
});
