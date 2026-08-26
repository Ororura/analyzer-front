import * as cheerio from 'cheerio';
import type { AnyNode } from 'domhandler';
import { HhError } from './errors.js';
import type { ParsedSalary, ParsedSearchPage, ParsedVacancy } from './types.js';

const CAPTCHA_MARKERS = [
  'проверка, что вы не робот',
  'подтвердите, что вы не робот',
  'robot-check',
];

export const assertNotAntiBot = (html: string): void => {
  const sample = html.slice(0, 200_000).toLowerCase();
  const $ = cheerio.load(html);
  const hasCaptchaElement = $('form[action*="captcha" i], [data-qa*="captcha" i], input[name*="captcha" i]').length > 0;
  if (hasCaptchaElement || CAPTCHA_MARKERS.some((marker) => sample.includes(marker))) {
    throw new HhError('ANTI_BOT', 'HH.ru запросил проверку CAPTCHA', 503);
  }
};

export const parseSearchPage = (html: string, currentPage: number): ParsedSearchPage => {
  assertNotAntiBot(html);
  const $ = cheerio.load(html);
  const warnings: string[] = [];
  const itemsById = new Map<string, ParsedVacancy>();

  for (const posting of extractStructuredPostings($)) {
    const parsed = parseStructuredPosting(posting);
    if (parsed) itemsById.set(parsed.id, parsed);
  }

  $('[data-qa="vacancy-serp__vacancy"], [data-qa="serp-item__vacancy"]').each((_, element) => {
    const card = $(element);
    const link = card.find('[data-qa="serp-item__title"], [data-qa="vacancy-serp__vacancy-title"]').first();
    const url = canonicalVacancyUrl(link.attr('href'));
    const id = vacancyId(url || card.attr('data-vacancy-id'));
    const title = clean(link.text());
    if (!id || !url || !title) {
      warnings.push('Пропущена карточка с неполными обязательными полями');
      return;
    }
    const existing = itemsById.get(id);
    const employerLink = card.find('[data-qa="vacancy-serp__vacancy-employer"], [data-qa="vacancy-serp__vacancy-employer-text"]').first();
    const snippetParts = card.find('[data-qa*="vacancy_snippet"], [data-qa*="vacancy-snippet"]').map((__, node) => clean($(node).text())).get().filter(Boolean);
    itemsById.set(id, mergeParsed(existing, {
      id,
      url,
      title,
      company: clean(employerLink.text()) || undefined,
      companyId: employerId(employerLink.attr('href')),
      salary: parseSalary(clean(card.find('[data-qa="vacancy-serp__vacancy-compensation"], [data-qa="vacancy-serp__vacancy-salary"]').first().text())),
      location: clean(card.find('[data-qa="vacancy-serp__vacancy-address"], [data-qa="vacancy-serp__vacancy-location"]').first().text()) || undefined,
      experience: clean(card.find('[data-qa="vacancy-serp__vacancy-work-experience"]').first().text()) || undefined,
      snippet: snippetParts.join('\n') || undefined,
      requirements: textList(card.find('[data-qa*="snippet_requirement"]'), $),
      responsibilities: textList(card.find('[data-qa*="snippet_responsibility"]'), $),
      employment: clean(card.find('[data-qa="vacancy-serp__vacancy-employment"]').first().text()) || undefined,
      workFormat: clean(card.find('[data-qa="vacancy-serp__vacancy-work-format"], [data-qa="vacancy-serp__vacancy-work-schedule"]').first().text()) || undefined,
      publishedAt: parsePublishedDate(clean(card.find('[data-qa="vacancy-serp__vacancy-date"], time').first().attr('datetime') || card.find('[data-qa="vacancy-serp__vacancy-date"], time').first().text())),
    }));
  });

  const items = [...itemsById.values()];
  const isEmpty = $('[data-qa="vacancy-serp__no-vacancies"], [data-qa="bloko-header-2"]').filter((_, node) => /ничего не найдено|нет вакансий/i.test($(node).text())).length > 0
    || /найдено\s+0\s+ваканс/i.test($.root().text());
  if (items.length === 0 && !isEmpty) {
    throw new HhError('LAYOUT_CHANGED', 'Не удалось распознать разметку поиска HH.ru', 502);
  }

  const pages = $('[data-qa^="pager-page-"]').map((_, node) => Number.parseInt($(node).text(), 10)).get().filter(Number.isFinite);
  const totalPages = pages.length ? Math.max(...pages) : undefined;
  const hasNext = $('[data-qa="pager-next"]').length > 0 || (totalPages !== undefined && currentPage + 1 < totalPages);
  return { items, totalPages, hasNext, warnings };
};

export const parseVacancyDetail = (html: string, expectedId?: string): ParsedVacancy => {
  assertNotAntiBot(html);
  const $ = cheerio.load(html);
  const structured = extractStructuredPostings($).map(parseStructuredPosting).find(Boolean);
  const title = clean($('[data-qa="vacancy-title"], h1').first().text()) || structured?.title;
  const canonical = canonicalVacancyUrl($('link[rel="canonical"]').attr('href') || $('[data-qa="vacancy-title"]').closest('a').attr('href'));
  const id = vacancyId(canonical) || structured?.id || expectedId;
  if (!id || !title) throw new HhError('LAYOUT_CHANGED', 'Не удалось распознать страницу вакансии HH.ru', 502);

  const descriptionNode = $('[data-qa="vacancy-description"]').first();
  const description = cleanMultiline(descriptionNode.text()) || structured?.description;
  const employerLink = $('[data-qa="vacancy-company-name"]').first();
  const skills = $('[data-qa="skills-element"], [data-qa="bloko-tag__text"]').map((_, node) => clean($(node).text())).get().filter(Boolean);
  const labels = $('[data-qa="vacancy-view-employment-mode"], [data-qa="vacancy-view-work-schedule"], [data-qa="vacancy-view-work-formats"], [data-qa="vacancy-view-experience"]').map((_, node) => clean($(node).text())).get();

  return mergeParsed(structured, {
    id,
    url: canonical || structured?.url || `https://hh.ru/vacancy/${id}`,
    title,
    company: clean(employerLink.text()) || structured?.company,
    companyId: employerId(employerLink.attr('href')) || structured?.companyId,
    salary: parseSalary(clean($('[data-qa="vacancy-salary"]').first().text())) || structured?.salary,
    location: clean($('[data-qa="vacancy-view-raw-address"], [data-qa="vacancy-view-location"]').first().text()) || structured?.location,
    experience: findLabel(labels, /опыт/i) || structured?.experience,
    description,
    skills: skills.length ? [...new Set(skills)] : structured?.skills,
    requirements: extractSection(descriptionNode, $, /требован|мы ожидаем|вам потребуется/i),
    responsibilities: extractSection(descriptionNode, $, /обязанност|вам предстоит|чем предстоит/i),
    employment: findLabel(labels, /занятост|стажиров/i) || structured?.employment,
    schedule: findLabel(labels, /график/i) || structured?.schedule,
    workFormat: findLabel(labels, /формат работ|удал[её]н|гибрид|на месте/i) || structured?.workFormat,
    publishedAt: parsePublishedDate(clean($('[data-qa="vacancy-creation-time"], time').last().attr('datetime') || $('[data-qa="vacancy-creation-time"], time').last().text())) || structured?.publishedAt,
  });
};

const extractStructuredPostings = ($: cheerio.CheerioAPI): Record<string, unknown>[] => {
  const result: Record<string, unknown>[] = [];
  $('script[type="application/ld+json"]').each((_, node) => {
    try {
      collectPostings(JSON.parse($(node).text()), result);
    } catch {
      // Invalid optional structured data must not break selector-based parsing.
    }
  });
  return result;
};

const collectPostings = (value: unknown, result: Record<string, unknown>[]): void => {
  if (!value || typeof value !== 'object') return;
  if (Array.isArray(value)) return value.forEach((item) => collectPostings(item, result));
  const record = value as Record<string, unknown>;
  if (record['@type'] === 'JobPosting') result.push(record);
  Object.values(record).forEach((item) => collectPostings(item, result));
};

const parseStructuredPosting = (posting: Record<string, unknown>): ParsedVacancy | undefined => {
  const url = canonicalVacancyUrl(asString(posting.url));
  const id = vacancyId(url || asString(posting.identifier));
  const title = asString(posting.title);
  if (!id || !url || !title) return undefined;
  const organization = asRecord(posting.hiringOrganization);
  const location = asRecord(posting.jobLocation);
  const address = asRecord(location?.address);
  const salary = asRecord(posting.baseSalary);
  const salaryValue = asRecord(salary?.value);
  return {
    id,
    url,
    title: clean(title),
    company: clean(asString(organization?.name)) || undefined,
    location: clean([asString(address?.addressLocality), asString(address?.streetAddress)].filter(Boolean).join(', ')) || undefined,
    salary: salaryValue ? {
      from: asNumber(salaryValue.minValue),
      to: asNumber(salaryValue.maxValue),
      currency: asString(salary?.currency) || undefined,
    } : undefined,
    description: cleanMultiline(stripTags(asString(posting.description))) || undefined,
    employment: Array.isArray(posting.employmentType) ? posting.employmentType.map(asString).filter(Boolean).join(', ') : asString(posting.employmentType) || undefined,
    publishedAt: parsePublishedDate(asString(posting.datePosted)),
  };
};

const mergeParsed = (base: ParsedVacancy | undefined, extra: ParsedVacancy): ParsedVacancy => {
  const merged = { ...base, ...Object.fromEntries(Object.entries(extra).filter(([, value]) => value !== undefined && value !== '')) } as ParsedVacancy;
  merged.skills = extra.skills?.length ? extra.skills : base?.skills;
  merged.requirements = extra.requirements?.length ? extra.requirements : base?.requirements;
  merged.responsibilities = extra.responsibilities?.length ? extra.responsibilities : base?.responsibilities;
  return merged;
};

const parseSalary = (value: string): ParsedSalary | undefined => {
  if (!value || /не указан/i.test(value)) return undefined;
  const numbers = [...value.matchAll(/\d[\d\s\u00a0\u202f]*/g)].map((match) => Number(match[0].replace(/\D/g, ''))).filter(Boolean);
  if (!numbers.length) return undefined;
  const currency = /₽|руб/i.test(value) ? 'RUR' : /\$|USD/i.test(value) ? 'USD' : /€|EUR/i.test(value) ? 'EUR' : undefined;
  const isRange = /[-–—]/.test(value) || numbers.length > 1;
  return {
    from: /от/i.test(value) || isRange || (!/до/i.test(value) && numbers.length === 1) ? numbers[0] : undefined,
    to: /до/i.test(value) || isRange ? numbers.at(-1) : undefined,
    currency,
    gross: /до вычета налогов/i.test(value) ? true : /на руки/i.test(value) ? false : undefined,
  };
};

const extractSection = (root: cheerio.Cheerio<AnyNode>, $: cheerio.CheerioAPI, headingPattern: RegExp): string[] => {
  const result: string[] = [];
  root.find('h2, h3, strong, b').each((_, heading) => {
    if (!headingPattern.test(clean($(heading).text()))) return;
    let node = $(heading).parent().next();
    while (node.length && !/^(H2|H3)$/i.test(node.get(0)?.tagName || '')) {
      if (node.find('strong, b').length && /требован|мы ожидаем|вам потребуется|обязанност|вам предстоит|чем предстоит/i.test(clean(node.text()))) break;
      if (node.is('ul, ol')) result.push(...node.find('li').map((__, li) => clean($(li).text())).get().filter(Boolean));
      else {
        const text = clean(node.text());
        if (text) result.push(text);
      }
      node = node.next();
    }
  });
  return [...new Set(result)];
};

const parsePublishedDate = (value: string): string | undefined => {
  if (!value) return undefined;
  const direct = Date.parse(value);
  if (!Number.isNaN(direct)) return new Date(direct).toISOString();
  const months: Record<string, number> = { января: 0, февраля: 1, марта: 2, апреля: 3, мая: 4, июня: 5, июля: 6, августа: 7, сентября: 8, октября: 9, ноября: 10, декабря: 11 };
  const match = value.toLowerCase().match(/(\d{1,2})\s+([а-яё]+)(?:\s+(\d{4}))?/i);
  if (!match || months[match[2]] === undefined) return undefined;
  return new Date(Date.UTC(Number(match[3] || new Date().getUTCFullYear()), months[match[2]], Number(match[1]))).toISOString();
};

const canonicalVacancyUrl = (value?: string): string | undefined => {
  if (!value) return undefined;
  try {
    const url = new URL(value, 'https://hh.ru');
    const id = vacancyId(url.pathname);
    return id ? `https://hh.ru/vacancy/${id}` : undefined;
  } catch {
    return undefined;
  }
};

const vacancyId = (value?: string): string | undefined => value?.match(/(?:vacancy\/|^)(\d+)/)?.[1];
const employerId = (value?: string): string | undefined => value?.match(/employer\/(\d+)/)?.[1];
const clean = (value: string): string => value.replace(/\s+/g, ' ').trim();
const cleanMultiline = (value: string): string => value.split(/\n+/).map(clean).filter(Boolean).join('\n');
const stripTags = (value: string): string => cheerio.load(value).text();
const asString = (value: unknown): string => typeof value === 'string' || typeof value === 'number' ? String(value) : '';
const asNumber = (value: unknown): number | undefined => Number.isFinite(Number(value)) ? Number(value) : undefined;
const asRecord = (value: unknown): Record<string, unknown> | undefined => value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : undefined;
const findLabel = (values: string[], pattern: RegExp): string | undefined => values.find((value) => pattern.test(value));
const textList = (nodes: cheerio.Cheerio<AnyNode>, $: cheerio.CheerioAPI): string[] => nodes.map((_, node) => clean($(node).text())).get().filter(Boolean);
