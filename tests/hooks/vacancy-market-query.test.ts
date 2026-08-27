import { QueryClient } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { afterEach, describe, expect, it } from "vitest";
import { vacancyMarketQueryOptions } from "@/hooks/useVacancyMarketQuery";
import { VACANCIES_URL } from "../msw/handlers";
import { server } from "../msw/server";

const vacancy = {
  id: "vacancy-1",
  hhId: "1",
  title: "Java Backend Developer",
  company: "Example",
  companyId: "company-1",
  url: "https://hh.ru/vacancy/1",
  description: "Java Spring",
  skills: ["Java", "Spring"],
  requirements: [],
  responsibilities: [],
  source: "hh.ru" as const,
  normalizedAt: "2026-08-27T00:00:00.000Z",
};

describe("vacancy market query", () => {
  const queryClients: QueryClient[] = [];

  afterEach(() => {
    queryClients.splice(0).forEach((queryClient) => queryClient.clear());
  });

  const createQueryClient = () => {
    const queryClient = new QueryClient();
    queryClients.push(queryClient);
    return queryClient;
  };

  it("aggregates and caches live vacancy market data", async () => {
    let requestCount = 0;
    server.use(
      http.get(VACANCIES_URL, () => {
        requestCount += 1;
        return HttpResponse.json({
        items: [vacancy],
        pagination: { page: 0, pageSize: 20, hasNext: false },
        warnings: [],
        });
      }),
    );
    const queryClient = createQueryClient();

    const first = await queryClient.query(vacancyMarketQueryOptions());
    const second = await queryClient.query(vacancyMarketQueryOptions());

    expect(first).toMatchObject({ source: "live", sampleSize: 1 });
    expect(second).toBe(first);
    expect(requestCount).toBe(1);

    await queryClient.invalidateQueries({ queryKey: vacancyMarketQueryOptions().queryKey });
    await queryClient.query(vacancyMarketQueryOptions());
    expect(requestCount).toBe(2);
  });

  it("resolves baseline data instead of a query error when HH is unavailable", async () => {
    server.use(
      http.get(VACANCIES_URL, () => HttpResponse.json({ message: "HH unavailable" }, { status: 503 })),
    );
    const queryClient = createQueryClient();

    const market = await queryClient.query(vacancyMarketQueryOptions());

    expect(market.source).toBe("baseline");
    expect(market.warnings).toContain("HH unavailable");
    expect(queryClient.getQueryState(vacancyMarketQueryOptions().queryKey)?.status).toBe("success");
  });
});
