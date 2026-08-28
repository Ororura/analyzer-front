import {
  createBaselineMarketData,
  resolveVacancyMarketData,
  type ResolvedVacancyMarketData,
  type VacancyMarketData,
} from "@/lib/ats/market-data";
import { getApiJson } from "@/lib/api/client";

export async function getVacancyMarket(text = "Java Backend Developer"): Promise<ResolvedVacancyMarketData> {
  try {
    const params = new URLSearchParams({ text });
    const body = await getApiJson<VacancyMarketData>("/api/vacancy-market", params);
    return resolveVacancyMarketData(body);
  } catch (error) {
    const message = error instanceof Error ? error.message : "HH.ru временно недоступен";

    return createBaselineMarketData(message);
  }
}

export const loadVacancyMarket = getVacancyMarket;
