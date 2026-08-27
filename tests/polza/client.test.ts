import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { analyzeResume } from "@/lib/analysis/analyze-resume";
import { createBaselineMarketData } from "@/lib/ats/market-data";
import { AnalysisResponseError, PolzaApiError } from "@/lib/polza/errors";
import { validModelResponse } from "../fixtures/analysis";
import geminiResponse from "../fixtures/gemini-ats-response.json";

class MockFileReader {
  result: string | ArrayBuffer | null = null;
  error: DOMException | null = null;
  onload: ((event: ProgressEvent<FileReader>) => void) | null = null;
  onerror: ((event: ProgressEvent<FileReader>) => void) | null = null;
  readAsDataURL(): void {
    this.result = "data:application/pdf;base64,cGRm";
    this.onload?.({} as ProgressEvent<FileReader>);
  }
}

const completion = (content: string, ok = true, status = 200): Response =>
  new Response(
    JSON.stringify(
      ok
        ? {
            id: "1",
            object: "chat.completion",
            created: 1,
            model: "test",
            choices: [{ index: 0, message: { role: "assistant", content }, finish_reason: "stop" }],
          }
        : { error: { message: content } },
    ),
    { status, headers: { "Content-Type": "application/json" } },
  );

describe("Polza client", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 7, 27));
    vi.stubGlobal("FileReader", MockFileReader);
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("processes the real Gemini-shaped response through normalization, scoring and final validation", async () => {
    const fetchMock = vi.fn().mockResolvedValue(completion(JSON.stringify(geminiResponse)));
    const warning = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    vi.stubGlobal("fetch", fetchMock);

    const result = await analyzeResume(
      new File(["pdf"], "resume.pdf", { type: "application/pdf" }),
      "secret",
      "google/gemini-2.5-pro",
      createBaselineMarketData(),
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result.basicAnalysis.beforeMassApplications).toEqual([]);
    expect(result.basicAnalysis.experienceAnalysis[0]).toMatchObject({
      startDate: "2025-05",
      endDate: "present",
      durationMonths: 15,
      isFuture: false,
      isCurrent: true,
    });
    expect(result.atsAnalysis.experience.totalExperience.value).toBe("1 год 3 месяца");
    expect(result.atsAnalysis.structuredFilters.salary).toEqual({ status: "unknown", evidence: null });
    expect(
      result.atsAnalysis.technologies
        .filter((item) => item.status === "skills_only")
        .every((item) => item.evidence === null),
    ).toBe(true);
    for (const key of ["atsScore", "hhStructuredFilters", "keywordCoverage", "vacancyMatch"] as const) {
      expect(result.atsAnalysis[key]).toBeGreaterThanOrEqual(0);
      expect(result.atsAnalysis[key]).toBeLessThanOrEqual(100);
    }
    expect(result.atsAnalysis.scoreEvidence.targetLevelFit.join(" ")).not.toContain("120 000");
    expect(warning).toHaveBeenCalledWith(
      "Resume AI response consistency issues normalized",
      expect.arrayContaining([expect.objectContaining({ reason: "unknown_salary_assumption" })]),
    );
  });

  it("sends the PDF once and returns a validated, deterministically scored result", async () => {
    let sentBody: unknown;
    const fetchMock = vi.fn().mockImplementation(async (request: Request) => {
      sentBody = await request.clone().json();
      return completion(JSON.stringify(validModelResponse));
    });
    vi.stubGlobal("fetch", fetchMock);
    const result = await analyzeResume(
      new File(["pdf"], "resume.pdf", { type: "application/pdf" }),
      "secret",
      "model",
      createBaselineMarketData(),
    );
    expect(result.atsAnalysis.atsScore).toBeGreaterThanOrEqual(0);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const body = sentBody as {
      messages: Array<{ content: unknown }>;
      plugins: unknown[];
      response_format: { json_schema: { schema: unknown } };
    };
    expect(JSON.stringify(body).match(/file_data/g)).toHaveLength(1);
    expect(JSON.stringify(body)).not.toContain("vacancyDescription");
    expect(body.plugins).toHaveLength(1);
    expect(JSON.stringify(body.response_format.json_schema.schema)).toContain("hhSearchMatch");
    expect(JSON.stringify(body.messages[0]?.content)).toContain("CURRENT_DATE:");
  });

  it("sends an inline object schema to Gemini through Polza", async () => {
    let sentBody: unknown;
    const fetchMock = vi.fn().mockImplementation(async (request: Request) => {
      sentBody = await request.clone().json();
      return completion(JSON.stringify(validModelResponse));
    });
    vi.stubGlobal("fetch", fetchMock);
    await analyzeResume(
      new File(["pdf"], "resume.pdf", { type: "application/pdf" }),
      "secret",
      "google/gemini-2.5-pro",
      createBaselineMarketData(),
    );
    const body = sentBody as {
      response_format: { json_schema: { schema: Record<string, unknown> } };
    };
    expect(body.response_format.json_schema.schema).toMatchObject({ type: "object" });
    expect(body.response_format.json_schema.schema).not.toHaveProperty("$ref");
  });

  it("performs one schema repair without sending the PDF again", async () => {
    const sentBodies: string[] = [];
    const responses = [completion("{bad"), completion(JSON.stringify(validModelResponse))];
    const fetchMock = vi.fn().mockImplementation(async (request: Request) => {
      sentBodies.push(await request.clone().text());
      return responses[sentBodies.length - 1];
    });
    vi.stubGlobal("fetch", fetchMock);
    await analyzeResume(new File(["pdf"], "resume.pdf"), "secret", "model", createBaselineMarketData());
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(sentBodies[1]).not.toContain("file_data");
  });

  it("stops after one failed repair", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(() => Promise.resolve(completion("{bad"))),
    );
    await expect(
      analyzeResume(new File(["pdf"], "resume.pdf"), "secret", "model", createBaselineMarketData()),
    ).rejects.toBeInstanceOf(AnalysisResponseError);
  });

  it("surfaces provider errors without repair retries", async () => {
    const fetchMock = vi.fn().mockResolvedValue(completion("invalid key", false, 401));
    vi.stubGlobal("fetch", fetchMock);
    await expect(
      analyzeResume(new File(["pdf"], "resume.pdf"), "secret", "model", createBaselineMarketData()),
    ).rejects.toBeInstanceOf(PolzaApiError);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
