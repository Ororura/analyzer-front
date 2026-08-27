import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import type { VacancyService } from '../hh/service.js';

type QueryValue = string | string[] | undefined;
type VacancyQuery = Record<string, QueryValue>;

const optionalScalar = z.unknown().transform((value) =>
  typeof value === 'string' ? value : undefined,
);

const optionalInteger = z.unknown().transform((value, context): number | undefined => {
  if (value === undefined) return undefined;
  if (typeof value === 'string' && /^-?\d+$/.test(value)) return Number(value);
  context.addIssue({ code: z.ZodIssueCode.custom, message: 'Числовой параметр имеет неверный формат' });
  return z.NEVER;
});

const optionalList = z.unknown().transform((value, context): string[] | undefined => {
  if (value === undefined) return undefined;
  if (typeof value === 'string') return [value];
  if (Array.isArray(value) && value.every((item): item is string => typeof item === 'string')) {
    return value;
  }
  context.addIssue({ code: z.ZodIssueCode.custom, message: 'Параметр списка имеет неверный формат' });
  return z.NEVER;
});

export const vacancySearchQuerySchema = z.object({
  text: optionalScalar,
  page: optionalInteger,
  perPage: optionalInteger,
  salary: optionalInteger,
  location: optionalScalar,
  experience: optionalList,
  employment: optionalList,
  schedule: optionalList,
});

export const createVacancyRoutes = (service: VacancyService): FastifyPluginAsync => async (app) => {
  app.get<{ Querystring: VacancyQuery }>('/vacancies', async (request) => {
    const filters = vacancySearchQuerySchema.parse(request.query);
    return service.search(filters);
  });
};
