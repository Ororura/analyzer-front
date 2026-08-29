import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ResultDisplay } from "@/components/result/ResultDisplay";
import { formatAnalysisMarkdown } from "@/lib/analysis-result-format";
import { ProviderSelect } from "@/components/analyzer/AnalyzerForm";
import { ToastProvider } from "@/hooks/useToast";
import { resumeAnalysisResult } from "../fixtures/resume-analysis";

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
  });

  it("exports backend values without recalculation", () => {
    expect(formatAnalysisMarkdown(resumeAnalysisResult)).toContain("**Общая оценка:** 67/100");
  });
});
