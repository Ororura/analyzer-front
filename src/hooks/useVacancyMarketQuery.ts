import { queryOptions, useQuery } from "@tanstack/react-query";
import { loadVacancyMarket } from "@/lib/ats/load-vacancy-market";

export const VACANCY_MARKET_STALE_TIME = 5 * 60 * 1000;
export const vacancyMarketQueryKey = ["vacancy-market", "java-backend"] as const;

export const vacancyMarketQueryOptions = () =>
  queryOptions({
    queryKey: vacancyMarketQueryKey,
    queryFn: loadVacancyMarket,
    staleTime: VACANCY_MARKET_STALE_TIME,
    retry: false,
  });

export const useVacancyMarketQuery = () => useQuery(vacancyMarketQueryOptions());
