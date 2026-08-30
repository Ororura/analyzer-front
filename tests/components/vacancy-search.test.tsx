import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { VacancySearch } from "@/components/vacancies/VacancySearch";

describe("vacancy search controls", () => {
  it("renders a region dropdown with all Russia and popular technology toggles", () => {
    const queryClient = new QueryClient();
    const html = renderToStaticMarkup(
      <QueryClientProvider client={queryClient}><VacancySearch /></QueryClientProvider>,
    );

    expect(html).toContain('<option value="" selected="">По всей России</option>');
    expect(html).toContain('<option value="Москва">Москва</option>');
    expect(html).toContain('aria-label="Популярные технологии"');
    expect(html).toContain("Spring Boot");
    expect(html).toContain("PostgreSQL");
    queryClient.clear();
  });
});
