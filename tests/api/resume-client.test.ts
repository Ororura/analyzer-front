import { http, HttpResponse } from "msw";
import { afterEach, describe, expect, it, vi } from "vitest";
import { analyzeResume, getAiProviders } from "@/lib/api/resume";
import { getUserFacingErrorMessage } from "@/lib/api/errors";
import { ApiClientError } from "@/lib/api/client";
import { server } from "../msw/server";
import { AI_PROVIDERS_URL, RESUME_ANALYZE_URL } from "../msw/handlers";
import { resumeAnalysisResult, structuredResumeAnalysisResult } from "../fixtures/resume-analysis";

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

  it("posts the PDF as multipart and sends provider/profile as query parameters", async () => {
    const file = new File(["pdf"], "resume.pdf", { type: "application/pdf" });
    server.use(http.post(RESUME_ANALYZE_URL, async ({ request }) => {
      const contentType = request.headers.get("Content-Type") ?? "";
      expect(contentType).toMatch(/^multipart\/form-data; boundary=/);
      const url = new URL(request.url);
      expect(url.searchParams.get("provider")).toBe("CODEX_CLI");
      expect(url.searchParams.get("profile")).toBe("REACT_FRONTEND");
      const form = await request.formData();
      expect(form.get("provider")).toBeNull();
      expect(form.get("file")).toMatchObject({ name: "resume.pdf", type: "application/pdf" });
      expect(form.get("analysis")).toBeNull();
      return HttpResponse.json(resumeAnalysisResult);
    }));
    await expect(analyzeResume(file, { provider: "CODEX_CLI", profile: "REACT_FRONTEND" })).resolves.toBeTruthy();
  });

  it.each([
    [{ mode: "SINGLE_VACANCY", vacancyId: "hh-123" }],
    [{ mode: "SELECTED_VACANCIES", selection: { mode: "SELECTED", vacancyIds: ["hh-1", "hh-2"] } }],
    [{ mode: "SELECTED_VACANCIES", selection: {
      mode: "ALL_MATCHING",
      criteria: { query: "Java", technologies: ["Spring Boot"], page: 0, pageSize: 20 },
      excludedVacancyIds: ["hh-3"],
    } }],
  ] as const)("posts JSON analysis as an application/json part: %j", async (analysis) => {
    const file = new File(["pdf"], "resume.pdf", { type: "application/pdf" });
    server.use(http.post(RESUME_ANALYZE_URL, async ({ request }) => {
      const form = await request.formData();
      const analysisPart = form.get("analysis");
      expect(analysisPart).toBeInstanceOf(File);
      expect((analysisPart as File).type).toBe("application/json");
      expect(JSON.parse(await (analysisPart as File).text())).toEqual(analysis);
      expect(form.get("file")).toMatchObject({ name: "resume.pdf" });
      return HttpResponse.json(resumeAnalysisResult);
    }));
    await expect(analyzeResume(file, { provider: "CODEX_CLI", profile: "JAVA_BACKEND", analysis })).resolves.toBeTruthy();
  });

  it("passes AbortSignal to fetch", async () => {
    const controller = new AbortController();
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify(resumeAnalysisResult), {
      status: 200, headers: { "Content-Type": "application/json" },
    }));
    await analyzeResume(new File(["pdf"], "resume.pdf"), { provider: "POLZA", profile: "JAVA_BACKEND", signal: controller.signal });
    expect(fetchSpy.mock.calls[0]?.[1]).toMatchObject({ signal: controller.signal });
  });

  it("preserves structured backend error code and status", async () => {
    server.use(http.post(RESUME_ANALYZE_URL, () => HttpResponse.json({
      error: { code: "AI_PROVIDER_UNAVAILABLE", message: "backend details" },
    }, { status: 503 })));
    await expect(analyzeResume(new File(["pdf"], "resume.pdf"), { provider: "CODEX_CLI", profile: "JAVA_BACKEND" })).rejects.toMatchObject({
      code: "AI_PROVIDER_UNAVAILABLE", status: 503,
    });
  });

  it("rejects a successful response that does not match the analysis schema", async () => {
    server.use(http.post(RESUME_ANALYZE_URL, () => HttpResponse.json({ scores: { assessments: [] } })));
    await expect(analyzeResume(new File(["pdf"], "resume.pdf"), {
      provider: "CODEX_CLI",
      profile: "JAVA_BACKEND",
    })).rejects.toMatchObject({ code: "INVALID_RESPONSE", status: 200 });
  });

  it("parses the structured v2 response without dropping nested analysis fields", async () => {
    server.use(http.post(RESUME_ANALYZE_URL, () => HttpResponse.json(structuredResumeAnalysisResult)));
    const result = await analyzeResume(new File(["pdf"], "resume.pdf"), { provider: "CODEX_CLI", profile: "JAVA_BACKEND" });
    expect(result.metadata.analysisSchemaVersion).toBe(2);
    expect(result.marketFit?.breakdown?.components[0]).toMatchObject({ name: "mustHaveCoverage", weight: 0.4 });
    expect(result.skillEvidence?.skills[0]).toMatchObject({ status: "STRONG", confidence: 0.91 });
    expect(result.ats?.diagnostics[0]).toMatchObject({ status: "PARTIAL" });
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
    ["INVALID_SELECTION", "выбранные вакансии"], ["SELECTION_TOO_LARGE", "Максимум — 200"],
    ["VACANCY_NOT_FOUND", "больше недоступна"], ["VACANCY_RATE_LIMITED", "ограничил количество"],
    ["VACANCY_PROVIDER_TIMEOUT", "не ответил вовремя"], ["VACANCY_PROVIDER_FAILED", "временно недоступен"],
    ["INTERNAL_ERROR", "внутренняя ошибка"],
  ] as const;

  it.each(cases)("maps %s centrally", (code, fragment) => {
    expect(getUserFacingErrorMessage(new ApiClientError("raw", 400, code))).toContain(fragment);
  });

  it.each([
    [400, "PDF"], [413, "размер"], [415, "PDF"], [422, "извлечь текст"],
    [429, "ограничил"], [500, "временно недоступен"], [502, "некорректный ответ"],
    [503, "временно недоступен"], [504, "слишком много времени"],
  ] as const)("maps HTTP %s without exposing backend details", (status, fragment) => {
    const message = getUserFacingErrorMessage(new ApiClientError("internal stack trace", status));
    expect(message).toContain(fragment);
    expect(message).not.toContain("stack trace");
  });

  it("distinguishes network and aborted requests", () => {
    expect(getUserFacingErrorMessage(new TypeError("fetch failed"))).toContain("серверу анализа");
    expect(getUserFacingErrorMessage(new DOMException("aborted", "AbortError"))).toContain("отменён");
  });
});
