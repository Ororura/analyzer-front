import { getAiProviderLabel } from "@/lib/ai/providers";
import { getAnalysisProfileLabel, getCriterionLabel } from "@/lib/analysis-profiles";
import type { CandidateLevel, ResumeAnalysisResult } from "@/types/resume-analysis";

const LEVEL_LABELS: Record<CandidateLevel, string> = {
  junior: "Junior",
  junior_plus: "Junior+",
  middle_minus: "Middle−",
  middle: "Middle",
};

const markdownList = (title: string, items: string[]) =>
  `## ${title}\n${items.length ? items.map((item) => `- ${item}`).join("\n") : "Нет"}`;

const formatAssessments = (result: ResumeAnalysisResult): string => [
  "## Техническое соответствие",
  result.scores.assessments.length > 0
    ? result.scores.assessments.map((assessment) => [
      `### ${getCriterionLabel(assessment.criterionId)} — ${assessment.score}/10`,
      assessment.evidence.length > 0
        ? assessment.evidence.map((item) => `- ${item}`).join("\n")
        : "Недостаточно подтверждённых данных",
    ].join("\n")).join("\n\n")
    : "Технические критерии не получены.",
].join("\n");

export const formatAnalysisMarkdown = (result: ResumeAnalysisResult): string => {
  const provider = getAiProviderLabel(result.metadata.provider);
  return [
    `# Анализ резюме — ${result.targetRole}`,
    `**Профиль:** ${getAnalysisProfileLabel(result.metadata.analysisProfile)}`,
    `**Уровень:** ${LEVEL_LABELS[result.detectedLevel]}`,
    `**Общая оценка:** ${result.overallScore}/100`,
    `**Сила кандидата:** ${result.candidateStrength}/100`,
    `**AI provider:** ${provider}${result.metadata.model ? ` (${result.metadata.model})` : ""}`,
    formatAssessments(result),
    [
      "## Резюме и опыт",
      `- Коммерческий опыт: ${result.scores.commercialExperience}/10`,
      `- Качество описания опыта: ${result.scores.experienceDescription}/10`,
      `- ATS readability: ${result.scores.ats}/100`,
      `- Качество резюме: ${result.scores.resumeQuality}/100`,
    ].join("\n"),
    `## Опыт\n${result.experience.commercialYears} г. ${result.experience.remainingMonths} мес. (${result.experience.commercialMonths} мес.)`,
    markdownList("Сильные стороны", result.strengths),
    markdownList("Слабые стороны", result.weaknesses),
    markdownList("ATS-проблемы", result.atsIssues),
    markdownList("Рекомендации", result.recommendations),
    markdownList("Подтверждённые навыки", result.skills.confirmed),
    markdownList("Слабые подтверждения", result.skills.weakEvidence),
    markdownList("Не найдено в резюме", result.skills.missing),
    result.market.source === "selected_vacancies"
      ? `## Контекст вакансий\nАнализ выполнен по ${result.market.sampleSize === 1 ? "выбранной вакансии" : `${result.market.sampleSize} выбранным вакансиям`}`
      : "",
    result.vacancyFit ? [
      "## Соответствие вакансии",
      `**Соответствие уровню:** ${result.vacancyFit.candidateLevelFit}`,
      `**Релевантность опыта:** ${result.vacancyFit.experienceRelevanceScore}/10`,
      result.vacancyFit.requiredSkills.length ? markdownList("Обязательные навыки", result.vacancyFit.requiredSkills) : "",
      result.vacancyFit.optionalSkills.length ? markdownList("Дополнительные навыки", result.vacancyFit.optionalSkills) : "",
      result.vacancyFit.missingSkills.length ? markdownList("Не найдено в резюме", result.vacancyFit.missingSkills) : "",
      result.vacancyFit.risks.length ? markdownList("Риски", result.vacancyFit.risks) : "",
      result.vacancyFit.probableRejectionReasons.length ? markdownList("Возможные причины отказа", result.vacancyFit.probableRejectionReasons) : "",
    ].filter(Boolean).join("\n\n") : "",
    result.warnings.length ? markdownList("Предупреждения", result.warnings) : "",
    result.metadata.marketProfileVersion
      ? `---\nMarket profile: ${result.metadata.marketProfileVersion}${result.metadata.marketProfileSource ? ` (${result.metadata.marketProfileSource})` : ""}`
      : "",
  ].filter(Boolean).join("\n\n");
};
