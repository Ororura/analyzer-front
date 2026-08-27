import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AtsResultDisplay } from "@/components/result/AtsResultDisplay";
import { formatAnalysisMarkdown } from "@/components/result/ResultDisplay";
import { RawAtsAnalysisSchema } from "@/lib/analysis/schema";
import { createBaselineMarketData } from "@/lib/ats/market-data";
import { finalizeAtsAnalysis } from "@/lib/ats/scorer";
import { validFinalAtsAnalysis, validModelResponse } from "../fixtures/analysis";

describe("result rendering", () => {
  it("renders ATS scores, unknown filters, risks and conditional advice", () => {
    const raw = RawAtsAnalysisSchema.parse(validFinalAtsAnalysis);
    const html = renderToStaticMarkup(
      <AtsResultDisplay result={finalizeAtsAnalysis(raw, createBaselineMarketData("timeout"))} />,
    );
    expect(html).toContain("ATS / HH Analysis");
    expect(html).toContain("ATS Score");
    expect(html).toContain("HH Search Match");
    expect(html).toContain("Structured Filters");
    expect(html).toContain("Keyword Coverage");
    expect(html).toContain("Vacancy Match");
    expect(html).toContain("Recruiter Readability");
    expect(html).toContain("Технологии");
    expect(html).toContain("Сильные стороны");
    expect(html).toContain("Слабые стороны и риски");
    expect(html).toContain("Рекомендации");
    expect(html).toContain("Missing Core Keywords");
    expect(html).toContain("Нет данных");
    expect(html).toContain("Если у тебя действительно есть опыт");
    expect(html).toContain("использован встроенный baseline");
  });

  it("keeps rendering legacy basic results without an ATS block", () => {
    expect(formatAnalysisMarkdown(JSON.stringify(validModelResponse.basicAnalysis))).toContain("# Анализ резюме");
    expect(formatAnalysisMarkdown("# Старый анализ")).toBe("# Старый анализ");
  });
});
