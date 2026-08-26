import type { VacancySearchFilters, VacancySearchResult } from '../../src/types/vacancy.js';
import { HhError } from './errors.js';
import type { HhFetcher } from './fetcher.js';
import { fetchHhHtml } from './fetcher.js';
import { mapParsedVacancy } from './mapper.js';
import { parseSearchPage, parseVacancyDetail } from './parser.js';
import { buildSearchUrl } from './search-query.js';
import type { ParsedVacancy } from './types.js';

const MAX_PAGES = 10;
const MAX_VACANCIES = 200;
const MAX_PER_PAGE = 50;

export type VacancyService = ReturnType<typeof createVacancyService>;

export const createVacancyService = (
  fetcher: HhFetcher = fetchHhHtml,
  options: { concurrency?: number; cacheTtlMs?: number; cacheSize?: number } = {},
) => {
  const limit = createLimiter(options.concurrency ?? 4);
  const cache = new DetailCache(options.cacheTtlMs ?? 30 * 60_000, options.cacheSize ?? 500);

  return {
    async search(filters: VacancySearchFilters): Promise<VacancySearchResult> {
      const normalized = normalizeFilters(filters);
      const { url, fallbackLocation } = buildSearchUrl(normalized);
      const html = await fetcher(url);
      const parsedPage = parseSearchPage(html, normalized.page);
      const sourceItems = fallbackLocation
        ? parsedPage.items.filter((item) => item.location?.toLowerCase().includes(fallbackLocation.toLowerCase()))
        : parsedPage.items;
      const warnings = [...parsedPage.warnings];
      let stopDetails = false;

      const items = await Promise.all(sourceItems.map((item) => limit(async () => {
        if (!needsDetail(item) || stopDetails) return item;
        const cached = cache.get(item.id);
        if (cached) return mergeVacancy(item, cached);
        try {
          const detailHtml = await fetcher(new URL(`https://hh.ru/vacancy/${item.id}`));
          const detail = parseVacancyDetail(detailHtml, item.id);
          cache.set(item.id, detail);
          return mergeVacancy(item, detail);
        } catch (error) {
          if (error instanceof HhError && (error.code === 'RATE_LIMITED' || error.code === 'ANTI_BOT')) stopDetails = true;
          warnings.push(`Детали вакансии ${item.id} недоступны: ${safeDetailReason(error)}`);
          return item;
        }
      })));

      const maxPagesForSize = Math.min(MAX_PAGES, Math.ceil(MAX_VACANCIES / normalized.perPage));
      const totalPages = parsedPage.totalPages === undefined ? undefined : Math.min(parsedPage.totalPages, maxPagesForSize);
      const hasNext = parsedPage.hasNext && normalized.page + 1 < maxPagesForSize;
      return {
        items: items.map(mapParsedVacancy),
        pagination: { page: normalized.page, pageSize: normalized.perPage, totalPages, hasNext },
        warnings,
      };
    },
    clearCache: () => cache.clear(),
  };
};

const normalizeFilters = (filters: VacancySearchFilters) => {
  const page = filters.page ?? 0;
  const perPage = filters.perPage ?? 20;
  if (!Number.isInteger(page) || page < 0 || page >= MAX_PAGES) throw new RangeError(`page должен быть от 0 до ${MAX_PAGES - 1}`);
  if (!Number.isInteger(perPage) || perPage < 1 || perPage > MAX_PER_PAGE) throw new RangeError(`perPage должен быть от 1 до ${MAX_PER_PAGE}`);
  if (page * perPage >= MAX_VACANCIES) throw new RangeError(`Запрос превышает maxVacancies=${MAX_VACANCIES}`);
  const text = filters.text?.trim() || 'Java Backend Developer';
  if (text.length > 200) throw new RangeError('Поисковый запрос слишком длинный');
  return { ...filters, text, page, perPage };
};

const needsDetail = (item: ParsedVacancy): boolean => !item.skills?.length || (item.description || item.snippet || '').length < 200 || !item.workFormat;

const mergeVacancy = (search: ParsedVacancy, detail: ParsedVacancy): ParsedVacancy => ({
  ...search,
  ...Object.fromEntries(Object.entries(detail).filter(([, value]) => value !== undefined && value !== '')),
  requirements: detail.requirements?.length ? detail.requirements : search.requirements,
  responsibilities: detail.responsibilities?.length ? detail.responsibilities : search.responsibilities,
  skills: detail.skills?.length ? detail.skills : search.skills,
});

const safeDetailReason = (error: unknown): string => {
  if (!(error instanceof HhError)) return 'неизвестная ошибка';
  return {
    TIMEOUT: 'timeout', FORBIDDEN: 'доступ отклонён', NOT_FOUND: 'страница не найдена', RATE_LIMITED: 'слишком много запросов',
    UPSTREAM: 'ошибка HH.ru', ANTI_BOT: 'запрошена CAPTCHA', LAYOUT_CHANGED: 'разметка изменилась',
  }[error.code];
};

const createLimiter = (concurrency: number) => {
  let active = 0;
  const queue: Array<() => void> = [];
  const next = () => {
    if (active >= concurrency) return;
    const run = queue.shift();
    if (run) run();
  };
  return <T>(task: () => Promise<T>): Promise<T> => new Promise((resolve, reject) => {
    queue.push(() => {
      active++;
      task().then(resolve, reject).finally(() => {
        active--;
        next();
      });
    });
    next();
  });
};

class DetailCache {
  private readonly values = new Map<string, { expiresAt: number; value: ParsedVacancy }>();
  constructor(private readonly ttlMs: number, private readonly maxSize: number) {}
  get(key: string): ParsedVacancy | undefined {
    const entry = this.values.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt <= Date.now()) {
      this.values.delete(key);
      return undefined;
    }
    this.values.delete(key);
    this.values.set(key, entry);
    return entry.value;
  }
  set(key: string, value: ParsedVacancy): void {
    this.values.delete(key);
    this.values.set(key, { value, expiresAt: Date.now() + this.ttlMs });
    while (this.values.size > this.maxSize) this.values.delete(this.values.keys().next().value as string);
  }
  clear(): void { this.values.clear(); }
}
