import { describe, expect, it } from "vitest";
import { addUniqueTechnology, POPULAR_TECHNOLOGIES, toggleTechnology, VACANCY_REGIONS } from "@/lib/vacancies/options";

describe("vacancy filter options", () => {
  it("uses an empty area for all Russia and exposes supported regions", () => {
    expect(VACANCY_REGIONS[0]).toEqual({ value: "", label: "По всей России" });
    expect(VACANCY_REGIONS.map((region) => region.value)).toContain("Санкт-Петербург");
  });

  it("toggles popular technologies without case-insensitive duplicates", () => {
    expect(POPULAR_TECHNOLOGIES).toContain("REST API");
    expect(addUniqueTechnology(["Java"], " java ")).toEqual(["Java"]);
    expect(toggleTechnology(["Java"], "Java")).toEqual([]);
    expect(toggleTechnology([], "Spring Boot")).toEqual(["Spring Boot"]);
  });
});
