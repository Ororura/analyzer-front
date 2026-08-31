import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ResultDisplay } from "@/components/result/ResultDisplay";
import { formatAnalysisMarkdown } from "@/lib/analysis-result-format";
import { ProfileSelect, ProviderSelect } from "@/components/analyzer/AnalyzerForm";
import { ToastProvider } from "@/hooks/useToast";
import { goResumeAnalysisResult, reactResumeAnalysisResult, resumeAnalysisResult, structuredResumeAnalysisResult } from "../fixtures/resume-analysis";
import { ScoreCard } from "@/components/result/ScoreCard";
import { AnalysisDashboard } from "@/components/result/AnalysisDashboard";

describe("analysis profile selection", () => {
  it("renders every OpenAPI profile with a human-readable label", () => {
    const html = renderToStaticMarkup(<ProfileSelect value="JAVA_BACKEND" onChange={() => undefined} />);
    expect(html).toContain("Java Backend Developer");
    expect(html).toContain("React Frontend Developer");
  });
});

describe("structured analysis dashboard", () => {
  it("renders overview scores, level and a null-safe score card", () => {
    const dashboard = renderToStaticMarkup(<AnalysisDashboard result={structuredResumeAnalysisResult} />);
    const emptyScore = renderToStaticMarkup(<ScoreCard title="Market Fit" score={null} maxScore={100} />);
    expect(dashboard).toContain("Junior+");
    expect(dashboard).toContain("84/100");
    expect(dashboard).toContain("86/100");
    expect(emptyScore).toContain("Недостаточно данных");
    expect(emptyScore).not.toContain("0/100");
  });

  it("renders market percentiles without turning null into zero", () => {
    const html = renderToStaticMarkup(<AnalysisDashboard result={structuredResumeAnalysisResult} />);
    expect(html).toContain("82 percentile");
    expect(html).toContain("Пока недостаточно данных");
    expect(html).not.toContain("0 percentile");
  });

  it("groups evidence statuses and formats confidence", () => {
    const html = renderToStaticMarkup(<AnalysisDashboard result={structuredResumeAnalysisResult} />);
    expect(html).toContain("Сильное подтверждение");
    expect(html).toContain("Только упоминание");
    expect(html).toContain("Не найдено");
    expect(html).toContain("Уверенность 91%");
  });

  it("formats skill gaps and ROI values", () => {
    const html = renderToStaticMarkup(<AnalysisDashboard result={structuredResumeAnalysisResult} />);
    expect(html).toContain("27%");
    expect(html).toContain("+11%");
    expect(html).toContain("ROI 9.2/10");
    expect(html).toContain("+12%");
  });

  it("hides vacancy fit when null and renders it for a single vacancy", () => {
    const without = renderToStaticMarkup(<AnalysisDashboard result={structuredResumeAnalysisResult} />);
    const withVacancy = { ...structuredResumeAnalysisResult, vacancyFit: {
      score: 82, mustHaveCoverage: 100, niceToHaveCoverage: 74, experienceFit: 68, gradeFit: 84, technicalFit: 87,
      applyRecommendation: "APPLY" as const, blockers: [{ type: "EXPERIENCE" as const, required: "3+ года", actual: "1 год 4 месяца", severity: "HIGH" as const }], breakdown: null,
    } };
    const withHtml = renderToStaticMarkup(<AnalysisDashboard result={withVacancy} />);
    expect(without).not.toContain("Соответствие вакансии");
    expect(withHtml).toContain("Соответствие вакансии");
    expect(withHtml).toContain("Стоит откликнуться");
    expect(withHtml).toContain("3+ года");
  });

  it("prefers normalized risks and does not duplicate legacy weaknesses", () => {
    const html = renderToStaticMarkup(<AnalysisDashboard result={structuredResumeAnalysisResult} />);
    expect(html).toContain("Ограниченный коммерческий опыт");
    expect(html).not.toContain("Мало инфраструктуры");
    expect(html).toContain("Распознано частично");
  });
});

describe("provider selection", () => {
  it("renders both providers, selects backend default and disables unavailable options", () => {
    const html = renderToStaticMarkup(<ProviderSelect providers={{ defaultProvider: "CODEX_CLI", providers: [
      { id: "POLZA", available: false }, { id: "CODEX_CLI", available: true },
    ] }} value="CODEX_CLI" onChange={() => undefined} />);
    expect(html).toContain("Polza AI — недоступен");
    expect(html).toContain("disabled");
    expect(html).toContain("Codex CLI");
    expect(html).toMatch(/value="CODEX_CLI" selected/);
  });

  it("renders both providers as selectable when available", () => {
    const html = renderToStaticMarkup(<ProviderSelect providers={{ defaultProvider: "POLZA", providers: [
      { id: "POLZA", available: true }, { id: "CODEX_CLI", available: true },
    ] }} value="POLZA" onChange={() => undefined} />);
    expect(html).not.toContain("disabled");
  });
});

describe("result rendering", () => {
  it("renders nullable model, provider and backend-authoritative values", () => {
    const html = renderToStaticMarkup(<ToastProvider><ResultDisplay result={resumeAnalysisResult} file={new File([], "resume.pdf")} /></ToastProvider>);
    expect(html).toContain("AI provider: Codex CLI");
    expect(html).not.toContain("Модель:");
    expect(html).toContain("Middle−");
    expect(html).toContain("67/100");
    expect(html).toContain("2 г. 5 мес.");
    expect(html).toContain("8/10");
    expect(html).toContain('aria-valuenow="80"');
    expect(html).toContain('aria-valuenow="73"');
    expect(html).toContain("Разрабатывал сервисы на Java 17");
    expect(html).toContain("Недостаточно подтверждённых данных");
    expect(html).toContain("Часто встречается в вакансиях, но не найдено в резюме");
  });

  it("renders React criteria with the same generic component", () => {
    const html = renderToStaticMarkup(<ToastProvider><ResultDisplay result={reactResumeAnalysisResult} file={new File([], "react.pdf")} /></ToastProvider>);
    expect(html).toContain("JavaScript");
    expect(html).toContain("TypeScript");
    expect(html).toContain("Frontend Architecture");
    expect(html).toContain("React Testing Library");
  });

  it("renders an unknown profile and criteria without a dedicated renderer", () => {
    const html = renderToStaticMarkup(<ToastProvider><ResultDisplay result={goResumeAnalysisResult} file={new File([], "go.pdf")} /></ToastProvider>);
    expect(html).toContain("Go Backend");
    expect(html).toContain("Concurrency");
    expect(html).toContain("Distributed Systems");
  });

  it("exports backend values without recalculation", () => {
    expect(formatAnalysisMarkdown(resumeAnalysisResult)).toContain("**Общая оценка:** 67/100");
  });

  it("renders vacancy fit and selected vacancy context", () => {
    const result = {
      ...resumeAnalysisResult,
      market: { source: "selected_vacancies", sampleSize: 1 },
      vacancyFit: {
        requiredSkills: ["Java", "Spring Boot"], optionalSkills: ["Docker"], missingSkills: ["PostgreSQL"],
        experienceRelevanceScore: 7, candidateLevelFit: "MATCH", risks: ["Мало SQL"],
        probableRejectionReasons: ["PostgreSQL не подтверждён"],
      },
    };
    const html = renderToStaticMarkup(<ToastProvider><ResultDisplay result={result} file={new File([], "resume.pdf")} analysisContext={{ mode: "SINGLE_VACANCY", vacancyTitle: "Java Developer", vacancyCompany: "Acme" }} /></ToastProvider>);
    expect(html).toContain("Анализ выполнен по выбранной вакансии: Java Developer — Acme");
    expect(html).toContain("Соответствие вакансии");
    expect(html).toContain("Релевантность опыта");
    expect(html).toContain("PostgreSQL не подтверждён");
    expect(formatAnalysisMarkdown(result)).toContain("## Соответствие вакансии");
  });

  it("hides empty vacancy fit subsections", () => {
    const result = { ...resumeAnalysisResult, vacancyFit: {
      requiredSkills: [], optionalSkills: [], missingSkills: [], experienceRelevanceScore: 5,
      candidateLevelFit: "PARTIAL", risks: [], probableRejectionReasons: [],
    } };
    const html = renderToStaticMarkup(<ToastProvider><ResultDisplay result={result} file={new File([], "resume.pdf")} /></ToastProvider>);
    expect(html).toContain("Соответствие вакансии");
    expect(html).not.toContain("Возможные причины отказа");
    expect(html).not.toContain("Дополнительные навыки");
  });
});
