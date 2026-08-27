import { http, HttpResponse } from "msw";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { analyzeResume } from "@/lib/analysis/analyze-resume";
import { createBaselineMarketData } from "@/lib/ats/market-data";
import { AnalysisResponseError, PolzaApiError } from "@/lib/polza/errors";
import { validModelResponse } from "../fixtures/analysis";
import geminiResponse from "../fixtures/gemini-ats-response.json";
import {
  POLZA_COMPLETIONS_URL,
  polzaCompletionHandler,
  polzaErrorHandler,
} from "../msw/handlers";
import { server } from "../msw/server";

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

const completionResponse = (content: string) =>
  HttpResponse.json({ choices: [{ message: { role: "assistant", content } }] });

describe("Polza analysis flow", () => {
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

  it("regresses the real Gemini response through parsing, normalization, scoring and final validation", async () => {
    server.use(polzaCompletionHandler(JSON.stringify(geminiResponse)));
    const warning = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    const firstResult = await analyzeResume(
      new File(["pdf"], "resume.pdf", { type: "application/pdf" }),
      "secret",
      "google/gemini-2.5-pro",
      createBaselineMarketData(),
    );
    const secondResult = await analyzeResume(
      new File(["pdf"], "resume.pdf", { type: "application/pdf" }),
      "secret",
      "google/gemini-2.5-pro",
      createBaselineMarketData(),
    );

    expect(firstResult).toEqual(secondResult);
    expect(firstResult.basicAnalysis.beforeMassApplications).toEqual([]);
    expect(firstResult.basicAnalysis.experienceAnalysis[0]).toMatchObject({
      startDate: "2025-05",
      endDate: "present",
      durationMonths: 15,
      isFuture: false,
      isCurrent: true,
    });
    expect(firstResult.atsAnalysis.experience.totalExperience.value).toBe("1 год 3 месяца");
    expect(firstResult.atsAnalysis.structuredFilters.salary).toEqual({ status: "unknown", evidence: null });
    expect(
      firstResult.atsAnalysis.technologies
        .filter((item) => item.status === "skills_only")
        .every((item) => item.evidence === null),
    ).toBe(true);
    for (const key of ["atsScore", "hhStructuredFilters", "keywordCoverage", "vacancyMatch"] as const) {
      expect(firstResult.atsAnalysis[key]).toBeGreaterThanOrEqual(0);
      expect(firstResult.atsAnalysis[key]).toBeLessThanOrEqual(100);
    }
    expect(firstResult.atsAnalysis.scoreEvidence.targetLevelFit.join(" ")).not.toContain("120 000");
    expect(warning).toHaveBeenCalledWith(
      "Resume AI response consistency issues normalized",
      expect.arrayContaining([expect.objectContaining({ reason: "unknown_salary_assumption" })]),
    );
  });

  it("sends one PDF request with the provider response schema", async () => {
    let requestBody: unknown;
    server.use(
      http.post(POLZA_COMPLETIONS_URL, async ({ request }) => {
        requestBody = await request.json();
        return completionResponse(JSON.stringify(validModelResponse));
      }),
    );

    await analyzeResume(new File(["pdf"], "resume.pdf"), "secret", "model", createBaselineMarketData());

    const serializedBody = JSON.stringify(requestBody);
    expect(serializedBody.match(/file_data/g)).toHaveLength(1);
    expect(serializedBody).not.toContain("vacancyDescription");
    expect(serializedBody).toContain("hhSearchMatch");
    expect(serializedBody).toContain("CURRENT_DATE:");
  });

  it("sends an inline object schema to Gemini through Polza", async () => {
    let requestBody: unknown;
    server.use(
      http.post(POLZA_COMPLETIONS_URL, async ({ request }) => {
        requestBody = await request.json();
        return completionResponse(JSON.stringify(validModelResponse));
      }),
    );

    await analyzeResume(
      new File(["pdf"], "resume.pdf"),
      "secret",
      "google/gemini-2.5-pro",
      createBaselineMarketData(),
    );

    expect(requestBody).toMatchObject({
      response_format: { json_schema: { schema: { type: "object" } } },
    });
    expect(JSON.stringify(requestBody)).not.toContain('"$ref"');
  });

  it("repairs malformed AI JSON exactly once and validates the repaired response", async () => {
    const requestBodies: unknown[] = [];
    server.use(
      http.post(POLZA_COMPLETIONS_URL, async ({ request }) => {
        requestBodies.push(await request.json());
        return requestBodies.length === 1
          ? completionResponse('{"basicAnalysis":')
          : completionResponse(JSON.stringify(validModelResponse));
      }),
    );

    const result = await analyzeResume(
      new File(["pdf"], "resume.pdf"),
      "secret",
      "model",
      createBaselineMarketData(),
    );

    expect(requestBodies).toHaveLength(2);
    expect(JSON.stringify(requestBodies[1])).not.toContain("file_data");
    expect(result.atsAnalysis.atsScore).toBeGreaterThanOrEqual(0);
  });

  it("throws AnalysisResponseError after one failed repair", async () => {
    let requestCount = 0;
    server.use(
      http.post(POLZA_COMPLETIONS_URL, () => {
        requestCount += 1;
        return completionResponse("{invalid");
      }),
    );

    await expect(
      analyzeResume(new File(["pdf"], "resume.pdf"), "secret", "model", createBaselineMarketData()),
    ).rejects.toBeInstanceOf(AnalysisResponseError);
    expect(requestCount).toBe(2);
  });

  it("maps an HTTP 400 provider message to PolzaApiError without repair", async () => {
    server.use(polzaErrorHandler("Invalid API key", 400));

    await expect(
      analyzeResume(new File(["pdf"], "resume.pdf"), "secret", "model", createBaselineMarketData()),
    ).rejects.toMatchObject({
      name: "PolzaApiError",
      message: "Invalid API key",
      status: 400,
    } satisfies Partial<PolzaApiError>);
  });
});
