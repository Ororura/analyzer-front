import { QueryClient } from "@tanstack/react-query";
import { afterEach, describe, expect, it, vi } from "vitest";
import { vacancyMarketQueryOptions } from "@/hooks/useVacancyMarketQuery";

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

const response = (payload: unknown, status = 200) =>
  new Response(JSON.stringify(payload), { status, headers: { "Content-Type": "application/json" } });

describe("vacancy market query", () => {
  const queryClients: QueryClient[] = [];

  afterEach(() => {
    queryClients.splice(0).forEach((queryClient) => queryClient.clear());
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  const createQueryClient = () => {
    const queryClient = new QueryClient();
    queryClients.push(queryClient);
    return queryClient;
  };

  it("aggregates and caches live vacancy market data", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      response({
        items: [vacancy],
        pagination: { page: 0, pageSize: 20, hasNext: false },
        warnings: [],
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const queryClient = createQueryClient();

    const first = await queryClient.fetchQuery(vacancyMarketQueryOptions());
    const second = await queryClient.fetchQuery(vacancyMarketQueryOptions());

    expect(first).toMatchObject({ source: "live", sampleSize: 1 });
    expect(second).toBe(first);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("resolves baseline data instead of a query error when HH is unavailable", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response({ message: "HH unavailable" }, 503)));
    const queryClient = createQueryClient();

    const market = await queryClient.fetchQuery(vacancyMarketQueryOptions());

    expect(market.source).toBe("baseline");
    expect(market.warnings).toContain("HH unavailable");
    expect(queryClient.getQueryState(vacancyMarketQueryOptions().queryKey)?.status).toBe("success");
  });
});
