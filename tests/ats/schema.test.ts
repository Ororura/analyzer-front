import { describe, expect, it } from "vitest";
import { buildSystemPrompt } from "@/config/analyzer-prompt";
import { extractJsonObject, parseModelResponse } from "@/lib/analysis/parse-model-response";
import { AiResumeAnalysisResponseSchema } from "@/lib/analysis/schema";
import { validModelResponse } from "../fixtures/analysis";

describe("AI response validation", () => {
  it("accepts the complete response and missing optional example", () =>
    expect(AiResumeAnalysisResponseSchema.safeParse(validModelResponse).success).toBe(true));
  it("extracts JSON when the model adds small surrounding noise", () => {
    const json = JSON.stringify(validModelResponse);
    const content = `Результат:\n\`\`\`json\n${json}\n\`\`\``;
    expect(extractJsonObject(content)).toBe(json);
    expect(parseModelResponse(content).success).toBe(true);
  });
  it("rejects invalid JSON", () => expect(parseModelResponse('{"basicAnalysis":').success).toBe(false));
  it("formats validation paths for repair feedback", () => {
    const invalid = structuredClone(validModelResponse) as unknown as { atsAnalysis: { hhSearchMatch: number } };
    invalid.atsAnalysis.hhSearchMatch = 101;
    const result = parseModelResponse(JSON.stringify(invalid));
    expect(result).toMatchObject({ success: false });
    if (!result.success) expect(result.issues[0]).toMatch(/^atsAnalysis\.hhSearchMatch: /);
  });
  it("rejects out-of-bound scores", () => {
    const invalid = structuredClone(validModelResponse) as unknown as { atsAnalysis: { hhSearchMatch: number } };
    invalid.atsAnalysis.hhSearchMatch = 101;
    expect(AiResumeAnalysisResponseSchema.safeParse(invalid).success).toBe(false);
  });
  it("rejects hallucination-prone claims without evidence", () => {
    const invalid = structuredClone(validModelResponse) as unknown as {
      atsAnalysis: { technologies: Array<{ technology: string; status: string; evidence: string | null }> };
    };
    invalid.atsAnalysis.technologies[0] = { technology: "Java", status: "confirmed_experience", evidence: null };
    expect(AiResumeAnalysisResponseSchema.safeParse(invalid).success).toBe(false);
  });
  it("treats May 2025 through present as past-started employment at CURRENT_DATE 2026-08-27", () => {
    const prompt = buildSystemPrompt("2026-08-27");
    expect(prompt).toContain("CURRENT_DATE: 2026-08-27");
    expect(prompt).toContain("Май 2025 — настоящее время");
    expect(prompt).toContain("корректно начался в прошлом");
  });
});
