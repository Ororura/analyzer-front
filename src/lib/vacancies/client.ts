import type { VacancySearchFilters, VacancySearchResult } from '@/types/vacancy';
import { ApiClientError, getApiJson } from '@/lib/api/client';

export class VacancyClientError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = 'VacancyClientError';
  }
}

export const fetchVacancies = async (
  filters: VacancySearchFilters = {},
): Promise<VacancySearchResult> => {
  const params = new URLSearchParams();
  params.set('text', filters.text || 'Java Backend Developer');
  params.set('page', String(filters.page ?? 0));
  params.set('perPage', String(filters.perPage ?? 20));

  for (const key of ['experience', 'employment', 'schedule'] as const) {
    for (const value of filters[key] ?? []) params.append(key, value);
  }
  if (filters.salary !== undefined) params.set('salary', String(filters.salary));
  if (filters.location) params.set('location', filters.location);

  try {
    return await getApiJson<VacancySearchResult>('/api/vacancies', params);
  } catch (error) {
    if (error instanceof ApiClientError) {
      throw new VacancyClientError(
        error.message === 'Backend request failed' ? 'Не удалось загрузить вакансии' : error.message,
        error.status,
      );
    }
    throw error;
  }
};
