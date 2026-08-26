import { describe, expect, it } from "vitest";
import { aggregateVacancyMarketData, canonicalTechnology, createBaselineMarketData } from "@/lib/ats/market-data";
import type { Vacancy } from "@/types/vacancy";

const vacancy = (id: string, skills: string[]): Vacancy => ({
  id,
  hhId: id,
  title: "Java Backend Developer",
  company: "Company",
  companyId: "company",
  url: `https://hh.ru/vacancy/${id}`,
  description: "",
  skills,
  requirements: [],
  responsibilities: [],
  source: "hh.ru",
  normalizedAt: "2026-08-27T00:00:00.000Z",
  experience: "1–3 года",
  workFormat: "Удалённо",
});

describe("vacancy market aggregation", () => {
  it("canonicalizes aliases and calculates vacancy shares", () => {
    const result = aggregateVacancyMarketData([
      vacancy("1", ["Spring", "REST endpoints"]),
      vacancy("2", ["Spring Boot"]),
    ]);
    expect(canonicalTechnology("REST endpoints")).toBe("REST API");
    expect(result.skillFrequencies["Spring Boot"]).toBe(1);
    expect(result.skillFrequencies["REST API"]).toBe(0.5);
    expect(result.experienceRequirements["1–3 года"]).toBe(2);
  });
  it("provides a deterministic baseline when HH data is unavailable", () => {
    const result = createBaselineMarketData("timeout");
    expect(result).toMatchObject({ source: "baseline", sampleSize: 0, warnings: ["timeout"] });
    expect(result.skillFrequencies.Java).toBeGreaterThan(result.skillFrequencies.Kubernetes);
  });
});
