import type { AiResumeAnalysisResponse } from "./schema";

const SALARY_ASSUMPTION = /(?:зарплат[^.!?\n]{0,60}\d|\d[\d\s]*\s*(?:₽|руб(?:л(?:ей|я)?)?))/iu;

export interface NormalizationDiagnostic {
  path: string;
  reason: "unknown_salary_assumption";
}

export const normalizeAiResumeAnalysis = (
  response: AiResumeAnalysisResponse,
): { result: AiResumeAnalysisResponse; diagnostics: NormalizationDiagnostic[] } => {
  if (response.atsAnalysis.structuredFilters.salary.status !== "unknown") {
    return { result: response, diagnostics: [] };
  }

  const diagnostics: NormalizationDiagnostic[] = [];
  const removeAssumptions = (values: string[], path: string): string[] =>
    values.filter((value, index) => {
      if (!SALARY_ASSUMPTION.test(value)) return true;
      diagnostics.push({ path: `${path}.${index}`, reason: "unknown_salary_assumption" });
      return false;
    });

  const atsAnalysis = response.atsAnalysis;
  const recommendations = atsAnalysis.recommendations.filter((recommendation, index) => {
    const isAssumption = [recommendation.problem, recommendation.recommendation, recommendation.evidence ?? ""].some(
      (value) => SALARY_ASSUMPTION.test(value),
    );
    if (isAssumption) {
      diagnostics.push({ path: `atsAnalysis.recommendations.${index}`, reason: "unknown_salary_assumption" });
    }
    return !isAssumption;
  });
  const summaryHasAssumption = SALARY_ASSUMPTION.test(atsAnalysis.summary);
  if (summaryHasAssumption) {
    diagnostics.push({ path: "atsAnalysis.summary", reason: "unknown_salary_assumption" });
  }

  return {
    result: {
      ...response,
      atsAnalysis: {
        ...atsAnalysis,
        scoreEvidence: {
          hhSearchMatch: removeAssumptions(
            atsAnalysis.scoreEvidence.hhSearchMatch,
            "atsAnalysis.scoreEvidence.hhSearchMatch",
          ),
          recruiterReadability: removeAssumptions(
            atsAnalysis.scoreEvidence.recruiterReadability,
            "atsAnalysis.scoreEvidence.recruiterReadability",
          ),
          targetLevelFit: removeAssumptions(
            atsAnalysis.scoreEvidence.targetLevelFit,
            "atsAnalysis.scoreEvidence.targetLevelFit",
          ),
        },
        strengths: removeAssumptions(atsAnalysis.strengths, "atsAnalysis.strengths"),
        weaknesses: removeAssumptions(atsAnalysis.weaknesses, "atsAnalysis.weaknesses"),
        recruiterRisks: removeAssumptions(atsAnalysis.recruiterRisks, "atsAnalysis.recruiterRisks"),
        recommendations,
        summary: summaryHasAssumption
          ? atsAnalysis.summary
              .split(/(?<=[.!?])\s+/u)
              .filter((sentence) => !SALARY_ASSUMPTION.test(sentence))
              .join(" ") || "Недостаточно непротиворечивых данных для итогового резюме."
          : atsAnalysis.summary,
      },
    },
    diagnostics,
  };
};
