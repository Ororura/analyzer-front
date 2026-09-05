import { VacancySearch } from '@/components/vacancies/VacancySearch';

export function MarketAnalysis() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Рынок вакансий</h2>
        <p className="text-muted-foreground">Поиск актуальных вакансий без запуска анализа резюме</p>
      </div>
      <VacancySearch />
    </div>
  );
}
