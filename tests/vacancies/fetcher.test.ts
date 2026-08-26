import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchHhHtml } from '../../server/hh/fetcher';

describe('HH HTTP fetcher', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('maps HTTP 429 and preserves Retry-After', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 429, headers: { 'retry-after': '60' } })));
    await expect(fetchHhHtml(new URL('https://hh.ru/search/vacancy'))).rejects.toMatchObject({
      code: 'RATE_LIMITED', status: 429, retryAfter: '60',
    });
  });

  it.each([[403, 'FORBIDDEN'], [404, 'NOT_FOUND'], [503, 'UPSTREAM']])('maps HTTP %s', async (status, code) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status })));
    await expect(fetchHhHtml(new URL('https://hh.ru/vacancy/1'))).rejects.toMatchObject({ code });
  });

  it('maps an aborted request to timeout', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('fetch', vi.fn((_url, init: RequestInit) => new Promise((_resolve, reject) => {
      init.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
    })));
    const promise = fetchHhHtml(new URL('https://hh.ru/search/vacancy'));
    const rejection = expect(promise).rejects.toMatchObject({ code: 'TIMEOUT' });
    await vi.advanceTimersByTimeAsync(10_000);
    await rejection;
    vi.useRealTimers();
  });
});
