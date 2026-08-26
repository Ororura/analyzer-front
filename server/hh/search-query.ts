import type { VacancySearchFilters } from '../../src/types/vacancy.js';

const AREA_IDS: Record<string, string> = {
  'москва': '1',
  'санкт-петербург': '2',
  'спб': '2',
  'екатеринбург': '3',
  'новосибирск': '4',
  'казань': '88',
  'нижний новгород': '66',
  'самара': '78',
  'ростов-на-дону': '76',
  'краснодар': '53',
};

export type BuiltSearchQuery = { url: URL; fallbackLocation?: string };

export const buildSearchUrl = (filters: Required<Pick<VacancySearchFilters, 'text' | 'page' | 'perPage'>> & VacancySearchFilters): BuiltSearchQuery => {
  const url = new URL('https://hh.ru/search/vacancy');
  let text = filters.text;
  url.searchParams.set('page', String(filters.page));
  url.searchParams.set('items_on_page', String(filters.perPage));
  url.searchParams.set('enable_snippets', 'true');
  url.searchParams.set('ored_clusters', 'true');

  for (const experience of filters.experience ?? []) url.searchParams.append('experience', experience);
  for (const employment of filters.employment ?? []) url.searchParams.append('employment', employment);
  for (const schedule of filters.schedule ?? []) {
    if (schedule === 'remote') url.searchParams.append('work_format', 'REMOTE');
    else url.searchParams.append('schedule', schedule);
  }
  if (filters.salary !== undefined) url.searchParams.set('salary', String(filters.salary));

  let fallbackLocation: string | undefined;
  const location = filters.location?.trim();
  if (location) {
    const area = /^\d+$/.test(location) ? location : AREA_IDS[location.toLowerCase()];
    if (area) url.searchParams.set('area', area);
    else {
      text = `${text} ${location}`;
      fallbackLocation = location;
    }
  }
  url.searchParams.set('text', text);
  return { url, fallbackLocation };
};
