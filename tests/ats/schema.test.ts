import { describe, expect, it } from "vitest";
import { ResumeModelResponseSchema } from "@/lib/analysis/schema";
import { extractJsonObject, parseModelResponse } from "@/lib/polza/client";
import { validModelResponse } from "../fixtures/analysis";

describe("AI response validation", () => {
  it("accepts the complete response and missing optional example", () =>
    expect(ResumeModelResponseSchema.safeParse(validModelResponse).success).toBe(true));
  it("extracts JSON when the model adds small surrounding noise", () => {
    const json = JSON.stringify(validModelResponse);
    const content = `Результат:\n\`\`\`json\n${json}\n\`\`\``;
    expect(extractJsonObject(content)).toBe(json);
    expect(parseModelResponse(content).success).toBe(true);
  });
  it("rejects invalid JSON", () => expect(parseModelResponse('{"basicAnalysis":').success).toBe(false));
  it("rejects out-of-bound scores", () => {
    const invalid = structuredClone(validModelResponse) as unknown as { atsAnalysis: { hhSearchMatch: number } };
    invalid.atsAnalysis.hhSearchMatch = 101;
    expect(ResumeModelResponseSchema.safeParse(invalid).success).toBe(false);
  });
  it("rejects hallucination-prone claims without evidence", () => {
    const invalid = structuredClone(validModelResponse) as unknown as {
      atsAnalysis: { technologies: Array<{ technology: string; status: string; evidence: string | null }> };
    };
    invalid.atsAnalysis.technologies[0] = { technology: "Java", status: "confirmed_experience", evidence: null };
    expect(ResumeModelResponseSchema.safeParse(invalid).success).toBe(false);
  });
});
