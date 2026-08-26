import { finalizeAtsAnalysis } from "@/lib/ats/scorer";
import type { VacancyMarketData } from "@/lib/ats/market-data";
import { AnalysisResponseError } from "@/lib/polza/errors";
import { normalizeAiResumeAnalysis } from "./normalize";
import {
  ResumeAnalysisResultSchema,
  type AiResumeAnalysisResponse,
  type ResumeAnalysisResult,
} from "./schema";
import { reportValidationIssues } from "./validation";

export const finalizeResponse = (
  response: AiResumeAnalysisResponse,
  market: VacancyMarketData,
): ResumeAnalysisResult => {
  const normalized = normalizeAiResumeAnalysis(response);
  if (normalized.diagnostics.length > 0) {
    console.warn("Resume AI response consistency issues normalized", normalized.diagnostics);
  }

  const finalResult = {
    basicAnalysis: normalized.result.basicAnalysis,
    atsAnalysis: finalizeAtsAnalysis(normalized.result.atsAnalysis, market),
  };
  const validationResult = ResumeAnalysisResultSchema.safeParse(finalResult);
  if (validationResult.success) return validationResult.data;

  throw new AnalysisResponseError(
    "Не удалось обработать результат анализа",
    reportValidationIssues("Final resume analysis validation failed", validationResult.error.issues),
  );
};
