import { describe, expect, it } from 'vitest';
import { HhError } from '../../server/hh/errors';
import { createVacancyService } from '../../server/hh/service';

const searchHtml = (count: number) => `<!doctype html><html><body>${Array.from({ length: count }, (_, index) => `
  <div data-qa="vacancy-serp__vacancy"><a data-qa="serp-item__title" href="/vacancy/${index + 1}">Vacancy ${index + 1}</a></div>`).join('')}
</body></html>`;

const detailHtml = (id: string) => `<!doctype html><html><head><link rel="canonical" href="https://hh.ru/vacancy/${id}"></head><body>
  <h1 data-qa="vacancy-title">Vacancy ${id}</h1><div data-qa="vacancy-description">${'Подробное описание '.repeat(20)}</div>
  <span data-qa="skills-element">Java</span><p data-qa="vacancy-view-work-formats">Формат работы: удалённо</p>
</body></html>`;

describe('vacancy service', () => {
  it('limits detail concurrency to four and caches details', async () => {
    let active = 0;
    let maximum = 0;
    let detailCalls = 0;
    const fetcher = async (url: URL) => {
      if (url.pathname === '/search/vacancy') return searchHtml(6);
      detailCalls++;
      active++;
      maximum = Math.max(maximum, active);
      await new Promise((resolve) => setTimeout(resolve, 5));
      active--;
      return detailHtml(url.pathname.split('/').at(-1)!);
    };
    const service = createVacancyService(fetcher, { concurrency: 4 });
    const first = await service.search({ text: 'Java' });
    const second = await service.search({ text: 'Java' });
    expect(first.items).toHaveLength(6);
    expect(second.items[0].skills).toEqual(['Java']);
    expect(maximum).toBe(4);
    expect(detailCalls).toBe(6);
  });

  it('keeps search data when detail loading fails', async () => {
    const fetcher = async (url: URL) => {
      if (url.pathname === '/search/vacancy') return searchHtml(1);
      throw new HhError('NOT_FOUND', 'missing', 404);
    };
    const result = await createVacancyService(fetcher).search({ text: 'Java' });
    expect(result.items[0]).toMatchObject({ id: 'hh-1', title: 'Vacancy 1' });
    expect(result.warnings[0]).toContain('страница не найдена');
  });
});
