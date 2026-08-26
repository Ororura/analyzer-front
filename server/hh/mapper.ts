import type { Vacancy } from '../../src/types/vacancy.js';
import type { ParsedVacancy } from './types.js';

export const mapParsedVacancy = (parsed: ParsedVacancy): Vacancy => ({
  id: `hh-${parsed.id}`,
  hhId: parsed.id,
  title: parsed.title,
  company: parsed.company || 'Неизвестно',
  companyId: parsed.companyId || '',
  url: parsed.url,
  location: parsed.location,
  salary: parsed.salary,
  description: parsed.description || parsed.snippet || '',
  skills: parsed.skills || [],
  requirements: parsed.requirements || [],
  responsibilities: parsed.responsibilities || [],
  experience: parsed.experience,
  employment: parsed.employment,
  schedule: parsed.schedule,
  workFormat: parsed.workFormat,
  source: 'hh.ru',
  publishedAt: parsed.publishedAt,
  normalizedAt: new Date().toISOString(),
});
