import type { VacancySearchFilters, VacancySearchResult } from '@/types/vacancy';

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

  const response = await fetch(`/api/vacancies?${params.toString()}`);
  const body = await response.json().catch(() => null) as VacancySearchResult | { message?: string } | null;
  if (!response.ok) {
    const message = body && 'message' in body ? body.message : undefined;
    throw new VacancyClientError(message || 'Не удалось загрузить вакансии', response.status);
  }
  return body as VacancySearchResult;
};
