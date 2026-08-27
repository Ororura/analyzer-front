import { QueryClient } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { afterEach, describe, expect, it } from "vitest";
import { vacancyMarketQueryOptions } from "@/hooks/useVacancyMarketQuery";
import { VACANCY_MARKET_URL } from "../msw/handlers";
import { server } from "../msw/server";

const market = {
  source: "live" as const,
  sampleSize: 1,
  skillFrequencies: { Java: 1, "Spring Boot": 1 },
  experienceRequirements: {},
  employmentTypes: {},
  workFormats: {},
  warnings: [],
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
      http.get(VACANCY_MARKET_URL, () => {
        requestCount += 1;
        return HttpResponse.json(market);
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
      http.get(VACANCY_MARKET_URL, () =>
        HttpResponse.json({ error: { code: "UPSTREAM", message: "HH unavailable" } }, { status: 503 })),
    );
    const queryClient = createQueryClient();

    const market = await queryClient.query(vacancyMarketQueryOptions());

    expect(market.source).toBe("baseline");
    expect(market.warnings).toContain("HH unavailable");
    expect(queryClient.getQueryState(vacancyMarketQueryOptions().queryKey)?.status).toBe("success");
  });
});
