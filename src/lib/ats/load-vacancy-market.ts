import { createBaselineMarketData, type VacancyMarketData } from "@/lib/ats/market-data";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL
  || (import.meta.env.DEV ? "http://localhost:8080" : globalThis.location?.origin ?? "http://localhost");

export async function getVacancyMarket(text = "Java Backend Developer"): Promise<VacancyMarketData> {
  try {
    const url = new URL("/api/vacancy-market", apiBaseUrl);
    url.searchParams.set("text", text);
    const response = await fetch(url);
    const body = await response.json().catch(() => null) as VacancyMarketData | { error?: { message?: string } } | null;
    if (!response.ok) {
      const message = body && "error" in body ? body.error?.message : undefined;
      throw new Error(message || "Не удалось загрузить рынок вакансий");
    }
    return body as VacancyMarketData;
  } catch (error) {
    const message = error instanceof Error ? error.message : "HH.ru временно недоступен";

    return createBaselineMarketData(message);
  }
}

export const loadVacancyMarket = getVacancyMarket;
