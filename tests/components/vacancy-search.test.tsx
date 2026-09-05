import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { VacancySearch } from '@/components/vacancies/VacancySearch';
import { getInitialVacancyCriteria } from '@/lib/vacancies/profile';

describe('vacancy search controls', () => {
  it('derives the initial vacancy query from the selected profile', () => {
    expect(getInitialVacancyCriteria('JAVA_BACKEND').query).toBe('Java Backend Developer');
    expect(getInitialVacancyCriteria('REACT_FRONTEND').query).toBe('React Frontend Developer');
    expect(getInitialVacancyCriteria().query).toBeUndefined();
  });
  it('renders a region dropdown with all Russia and popular technology toggles', () => {
    const queryClient = new QueryClient();
    const html = renderToStaticMarkup(
      <QueryClientProvider client={queryClient}>
        <VacancySearch profile="REACT_FRONTEND" />
      </QueryClientProvider>,
    );

    expect(html).toContain('<option value="" selected="">По всей России</option>');
    expect(html).toContain('<option value="Москва">Москва</option>');
    expect(html).toContain('aria-label="Популярные технологии"');
    expect(html).toContain('React Frontend Developer');
    expect(html).toContain('TypeScript');
    queryClient.clear();
  });
});
