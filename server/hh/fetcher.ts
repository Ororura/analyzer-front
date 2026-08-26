import { HhError } from './errors.js';

const ALLOWED_HOSTS = new Set(['hh.ru', 'www.hh.ru']);

export type HhFetcher = (url: URL) => Promise<string>;

export const fetchHhHtml: HhFetcher = async (initialUrl) => {
  let url = new URL(initialUrl);
  for (let redirect = 0; redirect <= 3; redirect++) {
    assertAllowedUrl(url);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10_000);
    let response: Response;
    try {
      response = await fetch(url, {
        redirect: 'manual',
        signal: controller.signal,
        headers: {
          accept: 'text/html,application/xhtml+xml',
          'accept-language': 'ru-RU,ru;q=0.9',
          'user-agent': 'pdf-analyzer/1.0 (public vacancy reader)',
        },
      });
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new HhError('TIMEOUT', 'HH.ru не ответил вовремя', 504);
      }
      throw new HhError('UPSTREAM', 'Не удалось подключиться к HH.ru', 502);
    } finally {
      clearTimeout(timer);
    }

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      if (!location || redirect === 3) {
        throw new HhError('UPSTREAM', 'Некорректный redirect от HH.ru', 502);
      }
      url = new URL(location, url);
      continue;
    }
    if (response.status === 403) throw new HhError('FORBIDDEN', 'HH.ru отклонил запрос', 403);
    if (response.status === 404) throw new HhError('NOT_FOUND', 'Страница вакансии не найдена', 404);
    if (response.status === 429) {
      throw new HhError('RATE_LIMITED', 'HH.ru временно ограничил запросы', 429, response.headers.get('retry-after') ?? undefined);
    }
    if (response.status >= 500) throw new HhError('UPSTREAM', 'Временная ошибка HH.ru', 502);
    if (!response.ok) throw new HhError('UPSTREAM', `Неожиданный ответ HH.ru: ${response.status}`, 502);
    return response.text();
  }
  throw new HhError('UPSTREAM', 'Слишком много redirects от HH.ru', 502);
};

const assertAllowedUrl = (url: URL): void => {
  if (url.protocol !== 'https:' || !ALLOWED_HOSTS.has(url.hostname)) {
    throw new HhError('UPSTREAM', 'Недопустимый адрес HH.ru', 502);
  }
};
