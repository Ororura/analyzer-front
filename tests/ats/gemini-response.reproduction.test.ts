import { describe, expect, it } from "vitest";
import { AiResumeAnalysisResponseSchema } from "@/lib/analysis/schema";
import geminiResponse from "../fixtures/gemini-ats-response.json";

describe("actual Gemini response reproduction", () => {
  it("accepts and normalizes the provider content payload", () => {
    const result = AiResumeAnalysisResponseSchema.parse(geminiResponse);
    expect(result.basicAnalysis.beforeMassApplications).toEqual([]);
    expect(result.basicAnalysis.studyPriority).toEqual([]);
    expect(result.basicAnalysis.notNeededNow).toEqual([]);
    expect(result.atsAnalysis.technologies.at(-1)?.evidence).toBeNull();
  });
});
