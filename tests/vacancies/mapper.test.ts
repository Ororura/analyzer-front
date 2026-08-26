import { describe, expect, it } from "vitest";
import { mapParsedVacancy } from "../../server/hh/mapper";
import { aggregateVacancyMarketData } from "@/lib/ats/market-data";

describe("vacancy domain mapping", () => {
  it("produces a domain vacancy usable by ATS and market analysis", () => {
    const vacancy = mapParsedVacancy({
      id: "42",
      url: "https://hh.ru/vacancy/42",
      title: "Java Developer",
      company: "Acme",
      description: "Java backend",
      skills: ["Java"],
      requirements: ["Java"],
      responsibilities: ["Backend development"],
      experience: "Без опыта",
    });
    expect(vacancy).toMatchObject({ id: "hh-42", hhId: "42", source: "hh.ru" });
    const market = aggregateVacancyMarketData([vacancy]);
    expect(market.sampleSize).toBe(1);
    expect(market.skillFrequencies.Java).toBe(1);
  });
});
