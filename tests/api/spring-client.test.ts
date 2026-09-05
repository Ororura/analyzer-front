import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { createApiUrl, getApiJson } from '@/lib/api/client';
import { getVacancy, searchVacancies } from '@/lib/vacancies/client';
import { getUserFacingErrorMessage } from '@/lib/api/errors';
import { server } from '../msw/server';

const API_URL = 'http://localhost:8080';
const criteria = { query: 'Java Backend', page: 0, pageSize: 20 as const };

describe('Spring API client', () => {
  it('uses VITE_API_URL fallback for Spring endpoints', () => {
    expect(createApiUrl('/api/health').toString()).toBe(`${API_URL}/api/health`);
  });

  it('serializes all current vacancy filters and technologies', async () => {
    server.use(
      http.get(`${API_URL}/api/vacancies`, ({ request }) => {
        const params = new URL(request.url).searchParams;
        expect(Object.fromEntries(params)).toMatchObject({
          query: 'Java Backend',
          area: 'Москва',
          employer: 'Acme',
          level: 'MIDDLE',
          workFormat: 'REMOTE',
          salaryFrom: '150000',
          salaryTo: '250000',
          currency: 'RUR',
          salaryOnly: 'true',
          publishedFrom: '2026-08-01',
          sort: 'DATE',
          page: '0',
          pageSize: '50',
        });
        expect(params.getAll('technologies')).toEqual(['Java', 'Spring Boot']);
        expect(params.has('text')).toBe(false);
        expect(params.has('perPage')).toBe(false);
        return HttpResponse.json({ items: [], page: 0, pageSize: 50, totalPages: 0, totalElements: 0, warnings: [] });
      }),
    );

    await expect(
      searchVacancies({
        ...criteria,
        area: 'Москва',
        employer: 'Acme',
        level: 'MIDDLE',
        workFormat: 'REMOTE',
        salaryFrom: 150000,
        salaryTo: 250000,
        currency: 'rur',
        salaryOnly: true,
        technologies: ['Java', 'Spring Boot'],
        publishedFrom: '2026-08-01',
        sort: 'DATE',
        pageSize: 50,
      }),
    ).resolves.toMatchObject({ totalElements: 0, warnings: [] });
  });

  it('uses top-level pagination fields', async () => {
    server.use(
      http.get(`${API_URL}/api/vacancies`, () =>
        HttpResponse.json({
          items: [],
          page: 2,
          pageSize: 20,
          totalPages: 7,
          totalElements: 133,
          pagination: { page: 99 },
          warnings: ['Количество приблизительное'],
        }),
      ),
    );
    await expect(searchVacancies({ ...criteria, page: 2 })).resolves.toMatchObject({
      page: 2,
      pageSize: 20,
      totalPages: 7,
      totalElements: 133,
    });
  });

  it('loads vacancy details only through the details endpoint', async () => {
    let searches = 0;
    server.use(
      http.get(`${API_URL}/api/vacancies`, () => {
        searches += 1;
        return HttpResponse.json({ items: [], page: 0, pageSize: 20, warnings: [] });
      }),
      http.get(`${API_URL}/api/vacancies/hh-123`, () =>
        HttpResponse.json({ id: 'hh-123', title: 'Java', skills: [], requirements: [], responsibilities: [] }),
      ),
    );
    await expect(getVacancy('hh-123')).resolves.toMatchObject({ id: 'hh-123' });
    expect(searches).toBe(0);
  });

  it('passes AbortSignal to vacancy requests', async () => {
    const controller = new AbortController();
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ items: [], page: 0, pageSize: 20, warnings: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    await searchVacancies(criteria, controller.signal);
    expect(spy.mock.calls[0]?.[1]).toMatchObject({ signal: controller.signal });
    spy.mockRestore();
  });

  it('preserves top-level vacancy error codes and maps 429', async () => {
    server.use(
      http.get(`${API_URL}/api/vacancies`, () =>
        HttpResponse.json({ code: 'RATE_LIMITED', message: 'raw' }, { status: 429 }),
      ),
    );
    const error = await searchVacancies(criteria).catch((caught: unknown) => caught);
    expect(error).toMatchObject({ code: 'RATE_LIMITED', status: 429 });
    expect(getUserFacingErrorMessage(error)).toContain('ограничил количество запросов');
  });

  it('rejects successful responses that are not JSON', async () => {
    server.use(http.get(`${API_URL}/api/health`, () => new HttpResponse('ok')));
    await expect(getApiJson('/api/health')).rejects.toMatchObject({
      message: 'Backend returned an invalid JSON response',
      status: 200,
    });
  });
});
