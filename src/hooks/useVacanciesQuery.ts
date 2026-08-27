import { queryOptions, useQuery } from "@tanstack/react-query";
import { fetchVacancies } from "@/lib/vacancies/client";
import type { VacancySearchFilters } from "@/types/vacancy";

export const VACANCIES_STALE_TIME = 5 * 60 * 1000;

const normalizeFilters = (filters: VacancySearchFilters): VacancySearchFilters => ({
  ...filters,
  experience: filters.experience ? [...filters.experience].sort() : undefined,
  employment: filters.employment ? [...filters.employment].sort() : undefined,
  schedule: filters.schedule ? [...filters.schedule].sort() : undefined,
});

export const vacanciesQueryOptions = (filters: VacancySearchFilters) => {
  const normalizedFilters = normalizeFilters(filters);

  return queryOptions({
    queryKey: ["vacancies", normalizedFilters] as const,
    queryFn: () => fetchVacancies(normalizedFilters),
    staleTime: VACANCIES_STALE_TIME,
    retry: 1,
  });
};

export const useVacanciesQuery = (filters: VacancySearchFilters | null) =>
  useQuery({
    ...vacanciesQueryOptions(filters ?? {}),
    enabled: filters !== null,
  });
