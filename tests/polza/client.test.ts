import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AnalysisResponseError, PolzaApiError, analyzeResume } from "@/lib/polza/client";
import { createBaselineMarketData } from "@/lib/ats/market-data";
import { validModelResponse } from "../fixtures/analysis";

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
    vi.stubGlobal("FileReader", MockFileReader);
  });
  afterEach(() => vi.unstubAllGlobals());

  it("sends the PDF once and returns a validated, deterministically scored result", async () => {
    const fetchMock = vi.fn().mockResolvedValue(completion(JSON.stringify(validModelResponse)));
    vi.stubGlobal("fetch", fetchMock);
    const result = await analyzeResume(
      new File(["pdf"], "resume.pdf", { type: "application/pdf" }),
      "secret",
      "model",
      createBaselineMarketData(),
    );
    expect(result.atsAnalysis.atsScore).toBeGreaterThanOrEqual(0);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const body = JSON.parse(String(fetchMock.mock.calls[0][1]?.body)) as {
      messages: Array<{ content: unknown }>;
      plugins: unknown[];
      response_format: { json_schema: { schema: unknown } };
    };
    expect(JSON.stringify(body).match(/file_data/g)).toHaveLength(1);
    expect(JSON.stringify(body)).not.toContain("vacancyDescription");
    expect(body.plugins).toHaveLength(1);
    expect(JSON.stringify(body.response_format.json_schema.schema)).toContain("hhSearchMatch");
  });

  it("sends an inline object schema to Gemini through Polza", async () => {
    const fetchMock = vi.fn().mockResolvedValue(completion(JSON.stringify(validModelResponse)));
    vi.stubGlobal("fetch", fetchMock);
    await analyzeResume(
      new File(["pdf"], "resume.pdf", { type: "application/pdf" }),
      "secret",
      "google/gemini-2.5-pro",
      createBaselineMarketData(),
    );
    const body = JSON.parse(String(fetchMock.mock.calls[0][1]?.body)) as {
      response_format: { json_schema: { schema: Record<string, unknown> } };
    };
    expect(body.response_format.json_schema.schema).toMatchObject({ type: "object" });
    expect(body.response_format.json_schema.schema).not.toHaveProperty("$ref");
  });

  it("performs one schema repair without sending the PDF again", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(completion("{bad"))
      .mockResolvedValueOnce(completion(JSON.stringify(validModelResponse)));
    vi.stubGlobal("fetch", fetchMock);
    await analyzeResume(new File(["pdf"], "resume.pdf"), "secret", "model", createBaselineMarketData());
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(String(fetchMock.mock.calls[1][1]?.body)).not.toContain("file_data");
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
