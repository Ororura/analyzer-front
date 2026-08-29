import { http, HttpResponse } from "msw";
import { afterEach, describe, expect, it, vi } from "vitest";
import { analyzeResume, getAiProviders } from "@/lib/api/resume";
import { getUserFacingErrorMessage } from "@/lib/api/errors";
import { ApiClientError } from "@/lib/api/client";
import { server } from "../msw/server";
import { AI_PROVIDERS_URL, RESUME_ANALYZE_URL } from "../msw/handlers";
import { resumeAnalysisResult } from "../fixtures/resume-analysis";

describe("resume backend client", () => {
  afterEach(() => vi.restoreAllMocks());

  it("loads provider configuration from the backend", async () => {
    server.use(http.get(AI_PROVIDERS_URL, ({ request }) => {
      expect(request.headers.get("Accept")).toBe("application/json");
      return HttpResponse.json({ defaultProvider: "CODEX_CLI", providers: [
        { id: "POLZA", available: true }, { id: "CODEX_CLI", available: true },
      ] });
    }));
    await expect(getAiProviders()).resolves.toMatchObject({ defaultProvider: "CODEX_CLI" });
  });

  it("posts the PDF and selected Codex provider as multipart data", async () => {
    const file = new File(["pdf"], "resume.pdf", { type: "application/pdf" });
    server.use(http.post(RESUME_ANALYZE_URL, async ({ request }) => {
      const contentType = request.headers.get("Content-Type") ?? "";
      expect(contentType).toMatch(/^multipart\/form-data; boundary=/);
      const form = await request.formData();
      expect(form.get("provider")).toBe("CODEX_CLI");
      expect(form.get("file")).toMatchObject({ name: "resume.pdf", type: "application/pdf" });
      return HttpResponse.json(resumeAnalysisResult);
    }));
    await expect(analyzeResume(file, { provider: "CODEX_CLI" })).resolves.toBeTruthy();
  });

  it("passes AbortSignal to fetch", async () => {
    const controller = new AbortController();
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify(resumeAnalysisResult), {
      status: 200, headers: { "Content-Type": "application/json" },
    }));
    await analyzeResume(new File(["pdf"], "resume.pdf"), { provider: "POLZA", signal: controller.signal });
    expect(fetchSpy.mock.calls[0]?.[1]).toMatchObject({ signal: controller.signal });
  });

  it("preserves structured backend error code and status", async () => {
    server.use(http.post(RESUME_ANALYZE_URL, () => HttpResponse.json({
      error: { code: "AI_PROVIDER_UNAVAILABLE", message: "backend details" },
    }, { status: 503 })));
    await expect(analyzeResume(new File(["pdf"], "resume.pdf"), { provider: "CODEX_CLI" })).rejects.toMatchObject({
      code: "AI_PROVIDER_UNAVAILABLE", status: 503,
    });
  });
});

describe("backend error messages", () => {
  const cases = [
    ["INVALID_FILE", "Не удалось обработать"], ["INVALID_QUERY", "Параметры запроса"],
    ["PDF_TOO_LARGE", "PDF превышает"], ["RESUME_TEXT_TOO_LARGE", "Текст резюме"],
    ["UNSUPPORTED_FILE_TYPE", "только PDF"], ["PDF_PARSE_FAILED", "прочитать PDF"],
    ["EMPTY_RESUME", "не найден текст"], ["AI_PROVIDER_FAILED", "завершил анализ с ошибкой"],
    ["AI_INVALID_RESPONSE", "некорректный результат"], ["AI_PROVIDER_UNAVAILABLE", "сейчас недоступен"],
    ["AI_PROCESS_START_FAILED", "не удалось запустить"], ["AI_RATE_LIMITED", "ограничил количество"],
    ["AI_TIMEOUT", "слишком много времени"], ["ANALYSIS_FAILED", "выполнить анализ"],
    ["INTERNAL_ERROR", "внутренняя ошибка"],
  ] as const;

  it.each(cases)("maps %s centrally", (code, fragment) => {
    expect(getUserFacingErrorMessage(new ApiClientError("raw", 400, code))).toContain(fragment);
  });
});
