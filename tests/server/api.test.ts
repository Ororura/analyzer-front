import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildApp } from '../../server/app';
import { HhError } from '../../server/hh/errors';
import type { VacancyService } from '../../server/hh/service';

const apps: ReturnType<typeof buildApp>[] = [];
const service = (search: VacancyService['search']): VacancyService => ({ search, clearCache: vi.fn() });
const createApp = (vacancyService: VacancyService) => {
  const app = buildApp({ frontend: false, logger: false, vacancyService });
  apps.push(app);
  return app;
};

afterEach(async () => {
  await Promise.all(apps.splice(0).map(async (app) => app.close()));
});

describe('Fastify server', () => {
  it('reports health', async () => {
    const response = await createApp(service(vi.fn())).inject({ method: 'GET', url: '/api/health' });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: 'ok' });
  });

  it('returns a successful vacancy search result', async () => {
    const search = vi.fn().mockResolvedValue({
      items: [],
      pagination: { page: 0, pageSize: 20, hasNext: false },
      warnings: [],
    });
    const response = await createApp(service(search)).inject({
      method: 'GET',
      url: '/api/vacancies?text=Java',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ items: [] });
    expect(search).toHaveBeenCalledWith(expect.objectContaining({ text: 'Java' }));
  });

  it('returns 400 for an invalid query before calling HH', async () => {
    const search = vi.fn();
    const response = await createApp(service(search)).inject({
      method: 'GET',
      url: '/api/vacancies?page=wrong',
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ code: 'INVALID_QUERY' });
    expect(search).not.toHaveBeenCalled();
  });

  it('maps an HH upstream error and Retry-After header', async () => {
    const search = vi.fn().mockRejectedValue(new HhError('RATE_LIMITED', 'HH unavailable', 429, '30'));
    const response = await createApp(service(search)).inject({ method: 'GET', url: '/api/vacancies' });

    expect(response.statusCode).toBe(429);
    expect(response.headers['retry-after']).toBe('30');
    expect(response.json()).toMatchObject({ code: 'RATE_LIMITED' });
  });

  it('hides unexpected server error details', async () => {
    const search = vi.fn().mockRejectedValue(new Error('sensitive detail'));
    const response = await createApp(service(search)).inject({ method: 'GET', url: '/api/vacancies' });

    expect(response.statusCode).toBe(500);
    expect(response.json()).toEqual({ code: 'INTERNAL', message: 'Не удалось загрузить вакансии' });
    expect(response.body).not.toContain('sensitive detail');
  });

  it('returns a structured 404 for unknown API routes', async () => {
    const response = await createApp(service(vi.fn())).inject({ method: 'GET', url: '/api/missing' });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual({ error: { code: 'NOT_FOUND', message: 'Route not found' } });
  });
});
