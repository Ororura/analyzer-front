import { useState } from "react";
import { Search, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader } from "@/components/ui/loader";
import { useToast } from "@/hooks/useToast";
import { fetchVacancies } from "@/lib/vacancies/client";
import { saveVacanciesToCache, getVacanciesFromCache } from "@/lib/vacancies/repository";
import type { Vacancy, VacancySearchFilters } from "@/types/vacancy";

export function MarketAnalysis() {
  const { addToast } = useToast();
  const [isFetching, setIsFetching] = useState(false);
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [searchTerm, setSearchTerm] = useState("Java Backend Developer");
  const [experienceFilter, setExperienceFilter] = useState<string[]>([]);
  const [scheduleFilter, setScheduleFilter] = useState<string[]>([]);
  const [location, setLocation] = useState("");
  const [page, setPage] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [totalPages, setTotalPages] = useState<number>();

  const fetchVacanciesHandler = async (requestedPage = 0) => {
    setIsFetching(true);
    const filters: VacancySearchFilters = {
      text: searchTerm || "Java Backend Developer",
      page: requestedPage,
      perPage: 20,
      experience: experienceFilter,
      schedule: scheduleFilter,
      location: location || undefined,
    };
    try {
      const cached = getVacanciesFromCache(filters);
      const result = cached ?? (await fetchVacancies(filters));
      setVacancies(result.items);
      setPage(result.pagination.page);
      setHasNext(result.pagination.hasNext);
      setTotalPages(result.pagination.totalPages);
      if (!cached) saveVacanciesToCache(result, filters);

      addToast({
        title: "Успех",
        description: `Загружено ${result.items.length} вакансий${result.warnings.length ? `, предупреждений: ${result.warnings.length}` : ""}`,
        variant: "success",
      });
    } catch {
      addToast({
        title: "Ошибка",
        description: "Не удалось загрузить вакансии",
        variant: "destructive",
      });
    } finally {
      setIsFetching(false);
    }
  };

  const toggleExperience = (exp: string) => {
    setExperienceFilter((prev) => (prev.includes(exp) ? prev.filter((e) => e !== exp) : [...prev, exp]));
  };

  const toggleSchedule = (sched: string) => {
    setScheduleFilter((prev) => (prev.includes(sched) ? prev.filter((s) => s !== sched) : [...prev, sched]));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Рынок вакансий</h2>
          <p className="text-muted-foreground">Актуальные вакансии Java Backend Developer</p>
        </div>
        <Button onClick={() => fetchVacanciesHandler(0)} disabled={isFetching} variant="outline">
          {isFetching ? (
            <>
              <Loader className="mr-2 h-4 w-4" />
              Загрузка...
            </>
          ) : (
            <>
              <Search className="mr-2 h-4 w-4" />
              Найти вакансии
            </>
          )}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Фильтры</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="search">Поиск</Label>
              <div className="flex gap-2">
                <Input
                  id="search"
                  placeholder="Должность, ключевые слова..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={() => fetchVacanciesHandler(0)} disabled={isFetching}>
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="location">Локация</Label>
              <Input
                id="location"
                placeholder="Москва, Санкт-Петербург..."
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label>Опыт</Label>
              <div className="flex flex-wrap gap-2">
                {["noExperience", "between1And3", "between3And6"].map((exp) => (
                  <Badge
                    key={exp}
                    variant={experienceFilter.includes(exp) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleExperience(exp)}
                  >
                    {exp === "noExperience" && "Без опыта"}
                    {exp === "between1And3" && "1-3 года"}
                    {exp === "between3And6" && "3-6 лет"}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="grid gap-2">
              <Label>График</Label>
              <div className="flex flex-wrap gap-2">
                {["fullDay", "remote", "flexible"].map((sched) => (
                  <Badge
                    key={sched}
                    variant={scheduleFilter.includes(sched) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleSchedule(sched)}
                  >
                    {sched === "fullDay" && "Полный день"}
                    {sched === "remote" && "Удаленно"}
                    {sched === "flexible" && "Гибкий"}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {vacancies.length === 0 ? (
          <div className="col-span-2 rounded-lg border bg-secondary/20 p-8 text-center">
            <Briefcase className="mx-auto h-16 w-16 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium">Нет вакансий</h3>
            <p className="text-muted-foreground">Нажмите "Найти вакансии" для загрузки</p>
          </div>
        ) : (
          vacancies.map((vacancy) => <VacancyCard key={vacancy.id} vacancy={vacancy} />)
        )}
      </div>

      {vacancies.length > 0 && (
        <div className="flex items-center justify-center gap-4">
          <Button variant="outline" disabled={isFetching || page === 0} onClick={() => fetchVacanciesHandler(page - 1)}>
            Назад
          </Button>
          <span className="text-sm text-muted-foreground">
            Страница {page + 1}
            {totalPages ? ` из ${totalPages}` : ""}
          </span>
          <Button variant="outline" disabled={isFetching || !hasNext} onClick={() => fetchVacanciesHandler(page + 1)}>
            Далее
          </Button>
        </div>
      )}
    </div>
  );
}

function VacancyCard({ vacancy }: { vacancy: Vacancy }) {
  return (
    <Card className="hover:border-primary transition-colors">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="line-clamp-2">{vacancy.title}</CardTitle>
            <p className="text-sm text-muted-foreground">{vacancy.company}</p>
          </div>
          <a href={vacancy.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
            >
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" x2="21" y1="14" y2="3" />
            </svg>
          </a>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {vacancy.salary && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
            >
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
            <span>
              {vacancy.salary.from && vacancy.salary.to
                ? `${vacancy.salary.from} - ${vacancy.salary.to} ${vacancy.salary.currency}`
                : vacancy.salary.from
                  ? `от ${vacancy.salary.from} ${vacancy.salary.currency}`
                  : vacancy.salary.to
                    ? `до ${vacancy.salary.to} ${vacancy.salary.currency}`
                    : ""}
              {vacancy.salary.gross === true && " (до вычета налогов)"}
              {vacancy.salary.gross === false && " (на руки)"}
            </span>
          </div>
        )}

        {vacancy.location && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
            >
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <span>{vacancy.location}</span>
          </div>
        )}

        {vacancy.employment && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <line x1="12" y1="8" x2="12" y2="16" />
              <line x1="8" y1="12" x2="16" y2="12" />
            </svg>
            <span>{vacancy.employment}</span>
          </div>
        )}

        {vacancy.schedule && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span>{vacancy.schedule}</span>
          </div>
        )}

        {vacancy.workFormat && vacancy.workFormat !== vacancy.schedule && (
          <div className="text-sm text-muted-foreground">{vacancy.workFormat}</div>
        )}

        {vacancy.publishedAt && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span>{new Date(vacancy.publishedAt).toLocaleDateString("ru-RU")}</span>
          </div>
        )}

        {vacancy.skills && vacancy.skills.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {vacancy.skills.slice(0, 5).map((skill, idx) => (
              <Badge key={idx} variant="secondary" className="text-xs">
                {skill}
              </Badge>
            ))}
            {vacancy.skills.length > 5 && (
              <Badge variant="outline" className="text-xs">
                +{vacancy.skills.length - 5}
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
