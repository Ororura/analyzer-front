import { ANALYSIS_PROFILE_CONFIG } from "@/lib/analysis-profiles";
import { DEFAULT_VACANCY_CRITERIA } from "@/types/vacancy";
import type { AnalysisProfile } from "@/types/resume-analysis";
import type { VacancySearchCriteria } from "@/types/vacancy";

export const getInitialVacancyCriteria = (profile?: AnalysisProfile): VacancySearchCriteria => ({
  ...DEFAULT_VACANCY_CRITERIA,
  query: profile ? ANALYSIS_PROFILE_CONFIG[profile].vacancyQuery : undefined,
});
