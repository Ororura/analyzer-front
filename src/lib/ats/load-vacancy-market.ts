import { fetchVacancies } from "@/lib/vacancies";
import { aggregateVacancyMarketData, createBaselineMarketData, type VacancyMarketData } from "@/lib/ats/market-data";

export async function loadVacancyMarket(): Promise<VacancyMarketData> {
  try {
    const vacancies = await fetchVacancies({
      text: "Java Backend Developer",
      perPage: 20,
    });

    return aggregateVacancyMarketData(vacancies.items, vacancies.warnings);
  } catch (error) {
    const message = error instanceof Error ? error.message : "HH.ru временно недоступен";

    return createBaselineMarketData(message);
  }
}
