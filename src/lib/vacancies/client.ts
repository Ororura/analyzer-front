import { getApiJson } from "@/lib/api/client";
import type { VacancyDetails, VacancySearchCriteria, VacancySearchResponse } from "@/types/vacancy";

const setString = (params: URLSearchParams, key: string, value: string | undefined) => {
  const normalized = value?.trim();
  if (normalized) params.set(key, normalized);
};

export const searchVacancies = async (
  criteria: VacancySearchCriteria,
  signal?: AbortSignal,
): Promise<VacancySearchResponse> => {
  const params = new URLSearchParams();
  setString(params, "query", criteria.query);
  setString(params, "area", criteria.area);
  setString(params, "employer", criteria.employer);
  setString(params, "level", criteria.level);
  setString(params, "workFormat", criteria.workFormat);
  if (criteria.salaryFrom !== undefined) params.set("salaryFrom", String(criteria.salaryFrom));
  if (criteria.salaryTo !== undefined) params.set("salaryTo", String(criteria.salaryTo));
  setString(params, "currency", criteria.currency?.toUpperCase());
  if (criteria.salaryOnly) params.set("salaryOnly", "true");
  for (const technology of criteria.technologies ?? []) {
    if (technology.trim()) params.append("technologies", technology.trim());
  }
  setString(params, "publishedFrom", criteria.publishedFrom);
  setString(params, "sort", criteria.sort);
  params.set("page", String(criteria.page));
  params.set("pageSize", String(criteria.pageSize));
  return getApiJson<VacancySearchResponse>("/api/vacancies", params, signal);
};

export const getVacancy = (id: string, signal?: AbortSignal): Promise<VacancyDetails> =>
  getApiJson<VacancyDetails>(`/api/vacancies/${encodeURIComponent(id)}`, undefined, signal);

export const fetchVacancies = searchVacancies;
