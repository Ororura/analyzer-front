import * as React from "react";
import { Briefcase, ExternalLink, Search, X } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader } from "@/components/ui/loader";
import { useVacanciesQuery, useVacancyDetailsQuery } from "@/hooks/useVacanciesQuery";
import type { useVacancySelection } from "@/hooks/useVacancySelection";
import { getUserFacingErrorMessage } from "@/lib/api/errors";
import { applyVacancyCriteria, withVacancyPage, withVacancyPageSize } from "@/lib/vacancies/criteria";
import { addUniqueTechnology, POPULAR_TECHNOLOGIES, toggleTechnology, VACANCY_REGIONS } from "@/lib/vacancies/options";
import {
  DEFAULT_VACANCY_CRITERIA,
  type VacancyDetails,
  type VacancyPageSize,
  type VacancySearchCriteria,
  type VacancySummary,
} from "@/types/vacancy";

type SelectionController = ReturnType<typeof useVacancySelection>;

interface VacancySearchProps {
  selection?: SelectionController;
  onAnalyzeSingle?: (vacancy: VacancySummary) => void;
  isAnalyzing?: boolean;
}

const selectClassName = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm";

const numberValue = (value: string): number | undefined => value === "" ? undefined : Number(value);

export function VacancySearch({ selection, onAnalyzeSingle, isAnalyzing = false }: VacancySearchProps) {
  const [draftCriteria, setDraftCriteria] = React.useState<VacancySearchCriteria>({ ...DEFAULT_VACANCY_CRITERIA });
  const [appliedCriteria, setAppliedCriteria] = React.useState<VacancySearchCriteria | null>(null);
  const [technology, setTechnology] = React.useState("");
  const [validationError, setValidationError] = React.useState<string | null>(null);
  const [selectionNotice, setSelectionNotice] = React.useState<string | null>(null);
  const [detailsId, setDetailsId] = React.useState<string | null>(null);
  const vacanciesQuery = useVacanciesQuery(appliedCriteria);
  const detailsQuery = useVacancyDetailsQuery(detailsId);

  const updateDraft = <K extends keyof VacancySearchCriteria>(key: K, value: VacancySearchCriteria[K]) => {
    setDraftCriteria((current) => ({ ...current, [key]: value }));
  };

  const addTechnology = () => {
    const value = technology.trim();
    if (!value) return;
    updateDraft("technologies", addUniqueTechnology(draftCriteria.technologies ?? [], value));
    setTechnology("");
  };

  const applyFilters = (event?: React.FormEvent) => {
    event?.preventDefault();
    if ((draftCriteria.query?.length ?? 0) > 200) {
      setValidationError("Поисковый запрос не должен превышать 200 символов.");
      return;
    }
    if (draftCriteria.salaryFrom !== undefined && draftCriteria.salaryTo !== undefined
      && draftCriteria.salaryFrom > draftCriteria.salaryTo) {
      setValidationError("Зарплата «от» не может быть больше зарплаты «до».");
      return;
    }
    setValidationError(null);
    setSelectionNotice(null);
    if (selection?.selection.mode === "ALL_MATCHING") {
      selection.resetAllMatching();
      setSelectionNotice("Выбор всех результатов сброшен, потому что применены новые фильтры.");
    }
    setAppliedCriteria(applyVacancyCriteria(draftCriteria));
  };

  const resetFilters = () => {
    setDraftCriteria({ ...DEFAULT_VACANCY_CRITERIA });
    setTechnology("");
    setValidationError(null);
  };

  const changePage = (page: number) => {
    if (!appliedCriteria) return;
    setAppliedCriteria(withVacancyPage(appliedCriteria, page));
  };

  const changePageSize = (pageSize: VacancyPageSize) => {
    updateDraft("pageSize", pageSize);
    if (appliedCriteria) setAppliedCriteria(withVacancyPageSize(appliedCriteria, pageSize));
  };

  const items = vacanciesQuery.data?.items ?? [];
  const pageIds = items.map((vacancy) => vacancy.id);
  const pageState = selection?.pageState(pageIds) ?? "unchecked";
  const totalElements = vacanciesQuery.data?.totalElements;
  const canOfferAll = Boolean(
    selection
    && selection.selection.mode === "SELECTED"
    && pageState === "checked"
    && totalElements !== undefined
    && totalElements > pageIds.length,
  );

  const selectAll = () => {
    if (!selection || !appliedCriteria || totalElements === undefined) return;
    if (totalElements > 200) {
      setSelectionNotice("Для одного анализа можно использовать максимум 200 вакансий. Уточните фильтры или выберите вакансии вручную.");
      return;
    }
    selection.selectAllMatching(appliedCriteria);
    setSelectionNotice(null);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle>Поиск вакансий</CardTitle></CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={applyFilters}>
            <div className="grid gap-4 md:grid-cols-[2fr_1fr_1fr]">
              <Field label="Поисковый запрос" htmlFor="vacancy-query">
                <Input id="vacancy-query" value={draftCriteria.query ?? ""} onChange={(event) => updateDraft("query", event.target.value)} placeholder="Java Backend Developer" />
              </Field>
              <Field label="Регион" htmlFor="vacancy-area">
                <select id="vacancy-area" className={selectClassName} value={draftCriteria.area ?? ""} onChange={(event) => updateDraft("area", event.target.value || undefined)}>
                  {VACANCY_REGIONS.map((region) => <option key={region.value || "all"} value={region.value}>{region.label}</option>)}
                </select>
              </Field>
              <Field label="Компания" htmlFor="vacancy-employer">
                <Input id="vacancy-employer" value={draftCriteria.employer ?? ""} onChange={(event) => updateDraft("employer", event.target.value)} placeholder="Acme" />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <SelectField label="Уровень" value={draftCriteria.level ?? ""} onChange={(value) => updateDraft("level", value as VacancySearchCriteria["level"])}>
                <option value="">Любой</option><option value="JUNIOR">Junior</option><option value="MIDDLE">Middle</option><option value="SENIOR">Senior</option>
              </SelectField>
              <SelectField label="Формат работы" value={draftCriteria.workFormat ?? ""} onChange={(value) => updateDraft("workFormat", value as VacancySearchCriteria["workFormat"])}>
                <option value="">Любой</option><option value="REMOTE">Удалённо</option><option value="OFFICE">Офис</option><option value="HYBRID">Гибрид</option>
              </SelectField>
              <SelectField label="Сортировка" value={draftCriteria.sort ?? ""} onChange={(value) => updateDraft("sort", value as VacancySearchCriteria["sort"])}>
                <option value="RELEVANCE">По релевантности</option><option value="DATE">По дате</option><option value="SALARY_DESC">По зарплате</option>
              </SelectField>
              <Field label="Дата публикации" htmlFor="vacancy-date">
                <Input id="vacancy-date" type="date" value={draftCriteria.publishedFrom ?? ""} onChange={(event) => updateDraft("publishedFrom", event.target.value || undefined)} />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Зарплата от" htmlFor="salary-from">
                <Input id="salary-from" type="number" min={0} value={draftCriteria.salaryFrom ?? ""} onChange={(event) => updateDraft("salaryFrom", numberValue(event.target.value))} />
              </Field>
              <Field label="Зарплата до" htmlFor="salary-to">
                <Input id="salary-to" type="number" min={0} value={draftCriteria.salaryTo ?? ""} onChange={(event) => updateDraft("salaryTo", numberValue(event.target.value))} />
              </Field>
              <Field label="Валюта" htmlFor="salary-currency">
                <Input id="salary-currency" value={draftCriteria.currency ?? ""} onChange={(event) => updateDraft("currency", event.target.value.toUpperCase())} placeholder="RUR" maxLength={3} />
              </Field>
            </div>

            <div className="space-y-2">
              <Label htmlFor="vacancy-technology">Технологии</Label>
              <div className="flex flex-wrap gap-2" aria-label="Популярные технологии">
                {POPULAR_TECHNOLOGIES.map((item) => {
                  const selected = (draftCriteria.technologies ?? []).some((technologyItem) => technologyItem.toLocaleLowerCase() === item.toLocaleLowerCase());
                  return <Button key={item} type="button" size="sm" variant={selected ? "default" : "outline"} aria-pressed={selected} onClick={() => updateDraft("technologies", toggleTechnology(draftCriteria.technologies ?? [], item))}>{item}</Button>;
                })}
              </div>
              <div className="flex gap-2">
                <Input id="vacancy-technology" value={technology} onChange={(event) => setTechnology(event.target.value)} onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === ",") { event.preventDefault(); addTechnology(); }
                }} placeholder="Java, Spring Boot..." />
                <Button type="button" variant="outline" onClick={addTechnology}>Добавить</Button>
              </div>
              {(draftCriteria.technologies?.length ?? 0) > 0 && <div className="flex flex-wrap gap-2">
                {draftCriteria.technologies?.map((item) => <Badge key={item} variant="secondary" className="gap-1">
                  {item}<button type="button" aria-label={`Удалить ${item}`} onClick={() => updateDraft("technologies", draftCriteria.technologies?.filter((technologyItem) => technologyItem !== item))}><X className="h-3 w-3" /></button>
                </Badge>)}
              </div>}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2 text-sm"><Checkbox checked={draftCriteria.salaryOnly ?? false} onChange={(event) => updateDraft("salaryOnly", event.target.checked)} />Только с указанной зарплатой</label>
              <Button type="submit" disabled={vacanciesQuery.isFetching}><Search className="mr-2 h-4 w-4" />{vacanciesQuery.isFetching ? "Ищем..." : "Найти"}</Button>
              <Button type="button" variant="outline" onClick={resetFilters}>Сбросить фильтры</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {validationError && <Alert variant="destructive"><AlertDescription>{validationError}</AlertDescription></Alert>}
      {selectionNotice && <Alert><AlertDescription>{selectionNotice}</AlertDescription></Alert>}
      {vacanciesQuery.isError && <Alert variant="destructive"><AlertTitle>Не удалось загрузить вакансии</AlertTitle><AlertDescription>{getUserFacingErrorMessage(vacanciesQuery.error)}</AlertDescription></Alert>}
      {(vacanciesQuery.data?.warnings.length ?? 0) > 0 && <Alert><AlertTitle>Обратите внимание</AlertTitle><AlertDescription><ul className="list-disc pl-5">{vacanciesQuery.data?.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul></AlertDescription></Alert>}

      {selection && items.length > 0 && <Card><CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6">
        <label className="flex items-center gap-2 text-sm font-medium">
          <Checkbox checked={pageState === "checked"} indeterminate={pageState === "indeterminate"} onChange={(event) => selection.setPage(pageIds, event.target.checked)} />
          Выбрать все на странице
        </label>
        <SelectionSummary selection={selection} totalElements={totalElements} />
        <Button type="button" size="sm" variant="outline" onClick={selection.clear}>Снять выбор</Button>
      </CardContent></Card>}

      {canOfferAll && <Alert><AlertDescription className="flex flex-wrap items-center justify-between gap-3">
        <span>Выбраны все {pageIds.length} вакансий на странице.</span>
        <Button type="button" size="sm" onClick={selectAll}>Выбрать все {totalElements} вакансий</Button>
      </AlertDescription></Alert>}

      {vacanciesQuery.isFetching && !vacanciesQuery.data ? <div className="flex justify-center py-10"><Loader className="h-8 w-8" /></div>
        : appliedCriteria && items.length === 0 && !vacanciesQuery.isError ? <EmptyVacancies />
          : !appliedCriteria ? <EmptyVacancies initial />
            : <div className="grid gap-4 md:grid-cols-2">{items.map((vacancy) => <VacancyCard
              key={vacancy.id}
              vacancy={vacancy}
              selected={selection?.isSelected(vacancy.id)}
              onSelectedChange={selection ? (checked) => selection.toggle(vacancy.id, checked) : undefined}
              onDetails={() => setDetailsId(vacancy.id)}
              onAnalyze={onAnalyzeSingle ? () => onAnalyzeSingle(vacancy) : undefined}
              isAnalyzing={isAnalyzing}
            />)}</div>}

      {appliedCriteria && vacanciesQuery.data && items.length > 0 && <Pagination
        page={vacanciesQuery.data.page}
        totalPages={vacanciesQuery.data.totalPages}
        pageSize={appliedCriteria.pageSize}
        isFetching={vacanciesQuery.isFetching}
        onPageChange={changePage}
        onPageSizeChange={changePageSize}
      />}

      {detailsId && <VacancyDetailsPanel
        vacancy={detailsQuery.data}
        isLoading={detailsQuery.isPending}
        error={detailsQuery.error}
        onClose={() => setDetailsId(null)}
        onAnalyze={detailsQuery.data && onAnalyzeSingle ? () => onAnalyzeSingle(detailsQuery.data!) : undefined}
        isAnalyzing={isAnalyzing}
      />}
    </div>
  );
}

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) {
  return <div className="grid gap-2"><Label htmlFor={htmlFor}>{label}</Label>{children}</div>;
}

function SelectField({ label, value, onChange, children }: { label: string; value: string; onChange: (value: string) => void; children: React.ReactNode }) {
  const id = React.useId();
  return <Field label={label} htmlFor={id}><select id={id} className={selectClassName} value={value} onChange={(event) => onChange(event.target.value)}>{children}</select></Field>;
}

function SelectionSummary({ selection, totalElements }: { selection: SelectionController; totalElements?: number }) {
  if (selection.selection.mode === "SELECTED") return <p className="text-sm">Выбрано: {selection.selectedCount ?? 0}</p>;
  return <div className="text-sm"><p>Выбраны все результаты{totalElements !== undefined ? `: около ${totalElements}` : ""}</p><p className="text-muted-foreground">Исключено: {selection.selection.excludedVacancyIds.length}</p></div>;
}

function EmptyVacancies({ initial = false }: { initial?: boolean }) {
  return <div className="rounded-lg border bg-secondary/20 p-8 text-center"><Briefcase className="mx-auto h-12 w-12 text-muted-foreground" /><h3 className="mt-3 font-medium">{initial ? "Найдите подходящие вакансии" : "Вакансии не найдены"}</h3><p className="text-sm text-muted-foreground">{initial ? "Настройте фильтры и нажмите «Найти»." : "Попробуйте изменить критерии поиска."}</p></div>;
}

function VacancyCard({ vacancy, selected, onSelectedChange, onDetails, onAnalyze, isAnalyzing }: {
  vacancy: VacancySummary; selected?: boolean; onSelectedChange?: (checked: boolean) => void; onDetails: () => void; onAnalyze?: () => void; isAnalyzing: boolean;
}) {
  return <Card><CardHeader><div className="flex items-start gap-3">
    {onSelectedChange && <Checkbox aria-label={`Выбрать ${vacancy.title ?? "вакансию"}`} checked={selected ?? false} onChange={(event) => onSelectedChange(event.target.checked)} />}
    <div className="min-w-0 flex-1"><CardTitle className="text-lg">{vacancy.title ?? "Без названия"}</CardTitle><p className="text-sm text-muted-foreground">{vacancy.company ?? "Компания не указана"}</p></div>
  </div></CardHeader><CardContent className="space-y-3">
    {vacancy.salary && <p className="font-medium">{formatSalary(vacancy.salary)}</p>}
    {(vacancy.location || vacancy.workFormat) && <p className="text-sm text-muted-foreground">{[vacancy.location, vacancy.workFormat].filter(Boolean).join(" · ")}</p>}
    {vacancy.experience && <p className="text-sm text-muted-foreground">{vacancy.experience}</p>}
    {vacancy.skills.length > 0 && <div className="flex flex-wrap gap-2">{vacancy.skills.slice(0, 6).map((skill) => <Badge key={skill} variant="secondary">{skill}</Badge>)}</div>}
    <div className="flex flex-wrap gap-2"><Button type="button" size="sm" variant="outline" onClick={onDetails}>Подробнее</Button>{onAnalyze && <Button type="button" size="sm" onClick={onAnalyze} disabled={isAnalyzing}>Анализировать по этой вакансии</Button>}</div>
  </CardContent></Card>;
}

function VacancyDetailsPanel({ vacancy, isLoading, error, onClose, onAnalyze, isAnalyzing }: {
  vacancy?: VacancyDetails; isLoading: boolean; error: Error | null; onClose: () => void; onAnalyze?: () => void; isAnalyzing: boolean;
}) {
  return <Card className="border-primary/40"><CardHeader><div className="flex items-start justify-between gap-4"><CardTitle>Подробности вакансии</CardTitle><Button type="button" variant="ghost" size="sm" onClick={onClose} aria-label="Закрыть"><X className="h-4 w-4" /></Button></div></CardHeader><CardContent className="space-y-4">
    {isLoading ? <div className="flex items-center gap-2"><Loader className="h-4 w-4" />Загружаем вакансию...</div>
      : error ? <Alert variant="destructive"><AlertDescription>{getUserFacingErrorMessage(error)}</AlertDescription></Alert>
        : vacancy && <>
          <div><h3 className="text-xl font-semibold">{vacancy.title}</h3><p className="text-muted-foreground">{vacancy.company}</p></div>
          {vacancy.salary && <p className="font-medium">{formatSalary(vacancy.salary)}</p>}
          <p className="text-sm">{[vacancy.location, vacancy.experience, vacancy.employment, vacancy.schedule, vacancy.workFormat].filter(Boolean).join(" · ")}</p>
          <DetailList title="Навыки" items={vacancy.skills} badges />
          <DetailList title="Требования" items={vacancy.requirements} />
          <DetailList title="Обязанности" items={vacancy.responsibilities} />
          {vacancy.description && <section><h4 className="mb-2 font-semibold">Описание</h4><p className="whitespace-pre-wrap text-sm">{htmlToPlainText(vacancy.description)}</p></section>}
          {vacancy.publishedAt && <p className="text-sm text-muted-foreground">Опубликовано: {formatDate(vacancy.publishedAt)}</p>}
          <div className="flex flex-wrap gap-2">{vacancy.url && <Button asChild size="sm" variant="outline"><a href={vacancy.url} target="_blank" rel="noopener noreferrer">Оригинальная вакансия<ExternalLink className="ml-2 h-4 w-4" /></a></Button>}{onAnalyze && <Button type="button" size="sm" onClick={onAnalyze} disabled={isAnalyzing}>Анализировать по этой вакансии</Button>}</div>
        </>}
  </CardContent></Card>;
}

function DetailList({ title, items, badges = false }: { title: string; items: string[]; badges?: boolean }) {
  if (items.length === 0) return null;
  return <section><h4 className="mb-2 font-semibold">{title}</h4>{badges ? <div className="flex flex-wrap gap-2">{items.map((item) => <Badge key={item} variant="secondary">{item}</Badge>)}</div> : <ul className="list-disc space-y-1 pl-5 text-sm">{items.map((item) => <li key={item}>{item}</li>)}</ul>}</section>;
}

function Pagination({ page, totalPages, pageSize, isFetching, onPageChange, onPageSizeChange }: {
  page: number; totalPages?: number; pageSize: VacancyPageSize; isFetching: boolean; onPageChange: (page: number) => void; onPageSizeChange: (size: VacancyPageSize) => void;
}) {
  const pages = Array.from({ length: totalPages ?? page + 1 }, (_, index) => index).slice(0, 10);
  return <div className="flex flex-wrap items-center justify-between gap-3"><div className="flex flex-wrap gap-1">
    <Button type="button" size="sm" variant="outline" disabled={isFetching || page === 0} onClick={() => onPageChange(page - 1)}>←</Button>
    {pages.map((pageNumber) => <Button key={pageNumber} type="button" size="sm" variant={pageNumber === page ? "default" : "outline"} disabled={isFetching} onClick={() => onPageChange(pageNumber)}>{pageNumber + 1}</Button>)}
    <Button type="button" size="sm" variant="outline" disabled={isFetching || totalPages === undefined || page + 1 >= totalPages} onClick={() => onPageChange(page + 1)}>→</Button>
  </div><label className="flex items-center gap-2 text-sm">На странице<select className={selectClassName} value={pageSize} onChange={(event) => onPageSizeChange(Number(event.target.value) as VacancyPageSize)}><option value={20}>20</option><option value={50}>50</option></select></label></div>;
}

const formatSalary = (salary: VacancySummary["salary"]): string => {
  if (!salary) return "";
  const amount = salary.from && salary.to ? `${salary.from.toLocaleString("ru-RU")}–${salary.to.toLocaleString("ru-RU")}` : salary.from ? `от ${salary.from.toLocaleString("ru-RU")}` : salary.to ? `до ${salary.to.toLocaleString("ru-RU")}` : "";
  return `${amount} ${salary.currency ?? ""}`.trim();
};

const formatDate = (value: string): string => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("ru-RU");
};

const htmlToPlainText = (value: string): string => {
  if (typeof DOMParser !== "undefined") return new DOMParser().parseFromString(value, "text/html").body.textContent ?? "";
  return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
};
