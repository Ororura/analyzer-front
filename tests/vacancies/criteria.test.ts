import { describe, expect, it } from 'vitest';
import { applyVacancyCriteria, withVacancyPage, withVacancyPageSize } from '@/lib/vacancies/criteria';

describe('vacancy criteria state', () => {
  it('applies a draft, normalizes values and resets page', () => {
    expect(
      applyVacancyCriteria({
        query: '  Java  ',
        area: ' Москва ',
        currency: 'rub',
        technologies: [' Spring ', ''],
        page: 7,
        pageSize: 20,
      }),
    ).toEqual({ query: 'Java', area: 'Москва', currency: 'RUB', technologies: ['Spring'], page: 0, pageSize: 20 });
  });

  it('pagination retains applied filters', () => {
    const applied = { query: 'Java', level: 'MIDDLE' as const, page: 0, pageSize: 20 as const };
    expect(withVacancyPage(applied, 3)).toEqual({ ...applied, page: 3 });
    expect(withVacancyPageSize({ ...applied, page: 3 }, 50)).toEqual({ ...applied, page: 0, pageSize: 50 });
  });
});
