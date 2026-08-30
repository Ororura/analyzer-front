import { queryOptions, useQuery } from "@tanstack/react-query";
import { getVacancy, searchVacancies } from "@/lib/vacancies/client";
import type { VacancySearchCriteria } from "@/types/vacancy";

export const VACANCIES_STALE_TIME = 5 * 60 * 1000;

const normalizeCriteria = (criteria: VacancySearchCriteria): VacancySearchCriteria => ({
  ...criteria,
  technologies: criteria.technologies ? [...criteria.technologies] : undefined,
});

export const vacanciesQueryOptions = (criteria: VacancySearchCriteria) => {
  const normalized = normalizeCriteria(criteria);
  return queryOptions({
    queryKey: ["vacancies", normalized] as const,
    queryFn: ({ signal }) => searchVacancies(normalized, signal),
    staleTime: VACANCIES_STALE_TIME,
    retry: 1,
  });
};

export const useVacanciesQuery = (criteria: VacancySearchCriteria | null) =>
  useQuery({
    ...(criteria ? vacanciesQueryOptions(criteria) : vacanciesQueryOptions({ page: 0, pageSize: 20 })),
    enabled: criteria !== null,
  });

export const useVacancyDetailsQuery = (id: string | null) =>
  useQuery({
    queryKey: ["vacancy", id] as const,
    queryFn: ({ signal }) => getVacancy(id!, signal),
    enabled: Boolean(id),
    staleTime: VACANCIES_STALE_TIME,
    retry: 1,
  });
