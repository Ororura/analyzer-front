import { finalizeAtsAnalysis } from "@/lib/ats/scorer";
import type { ResolvedVacancyMarketData } from "@/lib/ats/market-data";
import { AnalysisResponseError } from "@/lib/polza/errors";
import {
  calculateExperienceDurationMonths,
  calculateExperiencePeriod,
  formatExperienceDuration,
} from "@/lib/resume/experience-dates";
import { normalizeAiResumeAnalysis } from "./normalize";
import {
  ResumeAnalysisResultSchema,
  type AiResumeAnalysisResponse,
  type ResumeAnalysisResult,
} from "./schema";
import { reportValidationIssues } from "./validation";

export const finalizeResponse = (
  response: AiResumeAnalysisResponse,
  market: ResolvedVacancyMarketData,
  currentDate: Date,
): ResumeAnalysisResult => {
  const normalized = normalizeAiResumeAnalysis(response);
  if (normalized.diagnostics.length > 0) {
    console.warn("Resume AI response consistency issues normalized", normalized.diagnostics);
  }

  const experienceAnalysis = normalized.result.basicAnalysis.experienceAnalysis.map((experience) => ({
    ...experience,
    ...calculateExperiencePeriod(experience, currentDate),
  }));
  const experience = normalized.result.atsAnalysis.experience;
  const finalizedExperience = {
    totalExperience: finalizeExperienceAssessment(experience.totalExperience, currentDate),
    relevantJavaExperience: finalizeExperienceAssessment(experience.relevantJavaExperience, currentDate),
    backendExperience: finalizeExperienceAssessment(experience.backendExperience, currentDate),
    commercialExperience: finalizeExperienceAssessment(experience.commercialExperience, currentDate),
    projectExperience: finalizeExperienceAssessment(experience.projectExperience, currentDate),
  };
  const finalResult = {
    basicAnalysis: { ...normalized.result.basicAnalysis, experienceAnalysis },
    atsAnalysis: finalizeAtsAnalysis(
      { ...normalized.result.atsAnalysis, experience: finalizedExperience },
      market,
    ),
  };
  const validationResult = ResumeAnalysisResultSchema.safeParse(finalResult);
  if (validationResult.success) return validationResult.data;

  throw new AnalysisResponseError(
    "Не удалось обработать результат анализа",
    reportValidationIssues("Final resume analysis validation failed", validationResult.error.issues),
  );
};

type AiExperienceAssessment = AiResumeAnalysisResponse["atsAnalysis"]["experience"]["totalExperience"];

const finalizeExperienceAssessment = (assessment: AiExperienceAssessment, currentDate: Date) => ({
  value: formatExperienceDuration(calculateExperienceDurationMonths(assessment.periods, currentDate)),
  evidence: assessment.evidence,
});
