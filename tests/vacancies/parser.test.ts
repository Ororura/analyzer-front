import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { HhError } from '../../server/hh/errors';
import { parseSearchPage, parseVacancyDetail } from '../../server/hh/parser';

const fixture = (name: string) => readFileSync(path.join(import.meta.dirname, '../fixtures/hh', name), 'utf8');

describe('HH HTML parser', () => {
  it('parses a search page and pagination', () => {
    const page = parseSearchPage(fixture('search-page.html'), 0);
    expect(page.items).toHaveLength(1);
    expect(page.items[0]).toMatchObject({
      id: '123', title: 'Java Developer', company: 'Acme', companyId: '77', location: 'Москва',
      experience: 'Опыт 3–6 лет', workFormat: 'Можно удалённо',
      salary: { from: 180000, currency: 'RUR', gross: false },
    });
    expect(page.items[0].snippet).toContain('Spring Boot');
    expect(page.totalPages).toBe(3);
    expect(page.hasNext).toBe(true);
  });

  it('parses vacancy details', () => {
    const vacancy = parseVacancyDetail(fixture('vacancy-detail.html'));
    expect(vacancy).toMatchObject({
      id: '123', companyId: '77', skills: ['Java', 'Spring Boot'], employment: 'Полная занятость',
      schedule: 'График: 5/2', workFormat: 'Формат работы: удалённо',
      salary: { from: 180000, to: 230000, currency: 'RUR', gross: true },
    });
    expect(vacancy.description).toContain('Разрабатывать backend-сервисы');
    expect(vacancy.requirements).toContain('Знание Java и Spring Boot');
    expect(vacancy.responsibilities).toContain('Разрабатывать backend-сервисы');
  });

  it('tolerates missing optional search fields', () => {
    expect(parseSearchPage(fixture('search-optional-fields.html'), 0).items[0]).toEqual(expect.objectContaining({ id: '456', title: 'Junior Java Developer' }));
  });

  it('recognizes an empty result', () => {
    expect(parseSearchPage(fixture('search-empty.html'), 0)).toMatchObject({ items: [], hasNext: false });
  });

  it('reports an unexpected layout', () => {
    expect(() => parseSearchPage(fixture('unexpected-layout.html'), 0)).toThrowError(expect.objectContaining({ code: 'LAYOUT_CHANGED' }));
  });

  it('rejects CAPTCHA pages', () => {
    expect(() => parseSearchPage(fixture('captcha.html'), 0)).toThrowError(expect.objectContaining<HhError>({ code: 'ANTI_BOT' }));
  });
});
