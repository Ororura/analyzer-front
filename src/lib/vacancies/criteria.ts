import type { VacancyPageSize, VacancySearchCriteria } from "@/types/vacancy";

export const applyVacancyCriteria = (draft: VacancySearchCriteria): VacancySearchCriteria => ({
  ...draft,
  query: draft.query?.trim() || undefined,
  area: draft.area?.trim() || undefined,
  employer: draft.employer?.trim() || undefined,
  currency: draft.currency?.trim().toUpperCase() || undefined,
  technologies: draft.technologies?.map((item) => item.trim()).filter(Boolean),
  page: 0,
});

export const withVacancyPage = (criteria: VacancySearchCriteria, page: number): VacancySearchCriteria => ({
  ...criteria,
  page,
});

export const withVacancyPageSize = (
  criteria: VacancySearchCriteria,
  pageSize: VacancyPageSize,
): VacancySearchCriteria => ({ ...criteria, page: 0, pageSize });
