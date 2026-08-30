import { getAiProviderLabel } from "@/lib/ai/providers";
import type { CandidateLevel, ResumeAnalysisResult } from "@/types/resume-analysis";

const LEVEL_LABELS: Record<CandidateLevel, string> = {
  junior: "Junior",
  junior_plus: "Junior+",
  middle_minus: "Middle−",
  middle: "Middle",
};

const markdownList = (title: string, items: string[]) =>
  `## ${title}\n${items.length ? items.map((item) => `- ${item}`).join("\n") : "Нет"}`;

export const formatAnalysisMarkdown = (result: ResumeAnalysisResult): string => {
  const provider = getAiProviderLabel(result.metadata.provider);
  return [
    `# Анализ резюме — ${result.targetRole}`,
    `**Уровень:** ${LEVEL_LABELS[result.detectedLevel]}`,
    `**Общая оценка:** ${result.overallScore}/100`,
    `**Сила кандидата:** ${result.candidateStrength}/100`,
    `**AI provider:** ${provider}${result.metadata.model ? ` (${result.metadata.model})` : ""}`,
    `## Опыт\n${result.experience.commercialYears} г. ${result.experience.remainingMonths} мес. (${result.experience.commercialMonths} мес.)`,
    markdownList("Сильные стороны", result.strengths),
    markdownList("Слабые стороны", result.weaknesses),
    markdownList("ATS-проблемы", result.atsIssues),
    markdownList("Рекомендации", result.recommendations),
    markdownList("Подтверждённые навыки", result.skills.confirmed),
    markdownList("Слабые подтверждения", result.skills.weakEvidence),
    markdownList("Недостающие навыки", result.skills.missing),
    result.market.source === "selected_vacancies"
      ? `## Контекст вакансий\nАнализ выполнен по ${result.market.sampleSize === 1 ? "выбранной вакансии" : `${result.market.sampleSize} выбранным вакансиям`}`
      : "",
    result.vacancyFit ? [
      "## Соответствие вакансии",
      `**Соответствие уровню:** ${result.vacancyFit.candidateLevelFit}`,
      `**Релевантность опыта:** ${result.vacancyFit.experienceRelevanceScore}/10`,
      result.vacancyFit.requiredSkills.length ? markdownList("Обязательные навыки", result.vacancyFit.requiredSkills) : "",
      result.vacancyFit.optionalSkills.length ? markdownList("Дополнительные навыки", result.vacancyFit.optionalSkills) : "",
      result.vacancyFit.missingSkills.length ? markdownList("Не хватает", result.vacancyFit.missingSkills) : "",
      result.vacancyFit.risks.length ? markdownList("Риски", result.vacancyFit.risks) : "",
      result.vacancyFit.probableRejectionReasons.length ? markdownList("Возможные причины отказа", result.vacancyFit.probableRejectionReasons) : "",
    ].filter(Boolean).join("\n\n") : "",
    result.warnings.length ? markdownList("Предупреждения", result.warnings) : "",
  ].filter(Boolean).join("\n\n");
};
