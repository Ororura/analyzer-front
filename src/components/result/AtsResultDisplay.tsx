import { AlertTriangle, Award, CheckCircle2, Search, SlidersHorizontal } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import type { AtsAnalysisResult, FilterAssessment } from "@/types/ats";

interface AtsResultDisplayProps {
  result: AtsAnalysisResult;
}

type ScoreKey =
  "atsScore" | "hhSearchMatch" | "hhStructuredFilters" | "vacancyMatch" | "keywordCoverage" | "recruiterReadability";
const SCORE_LABELS: Array<[ScoreKey, string]> = [
  ["atsScore", "ATS Score"],
  ["hhSearchMatch", "HH Search Match"],
  ["hhStructuredFilters", "Structured Filters"],
  ["vacancyMatch", "Vacancy Match"],
  ["keywordCoverage", "Keyword Coverage"],
  ["recruiterReadability", "Recruiter Readability"],
];

const FILTER_LABELS: Record<keyof AtsAnalysisResult["structuredFilters"], string> = {
  experience: "Опыт",
  education: "Образование",
  location: "География",
  relocation: "Релокация",
  salary: "Зарплата",
  languages: "Языки",
  employmentType: "Занятость",
  workFormat: "Формат работы",
};

const STATUS_LABELS: Record<FilterAssessment["status"], string> = {
  match: "Совпадает",
  partial: "Частично",
  mismatch: "Не совпадает",
  unknown: "Нет данных",
};

const LEVEL_LABELS: Record<AtsAnalysisResult["detectedLevel"], string> = {
  intern: "Intern",
  junior: "Junior",
  junior_plus: "Junior+",
  middle: "Middle",
  middle_plus: "Middle+",
  senior: "Senior",
};

const CHANCE_LABELS: Record<AtsAnalysisResult["screeningChance"], string> = {
  low: "Низкая",
  below_average: "Ниже средней",
  medium: "Средняя",
  high: "Высокая",
  very_high: "Очень высокая",
};

export function AtsResultDisplay({ result }: AtsResultDisplayProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            ATS / HH Analysis
          </CardTitle>
          <CardDescription>
            Уровень: {LEVEL_LABELS[result.detectedLevel]} · Fit: {result.targetLevelFit}/100 · Шанс скрининга:{" "}
            {CHANCE_LABELS[result.screeningChance]}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {SCORE_LABELS.map(([key, label]) => (
            <ScoreRow key={key} label={label} value={result[key] as number} />
          ))}
          {result.marketData.source === "baseline" && (
            <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
              Live-данные HH.ru недоступны: использован встроенный baseline требований.
              {result.marketData.warnings.length > 0 && ` ${result.marketData.warnings.join("; ")}`}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <SummaryCard
          icon={<CheckCircle2 className="h-5 w-5 text-green-500" />}
          title="Сильные стороны"
          items={result.strengths}
        />
        <SummaryCard
          icon={<AlertTriangle className="h-5 w-5 text-amber-500" />}
          title="Слабые стороны и риски"
          items={[...result.weaknesses, ...result.recruiterRisks]}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Технологии
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <KeywordGroup title="Подтверждены опытом" values={result.keywords.confirmedByExperience} variant="success" />
          <KeywordGroup title="Только в Skills" values={result.keywords.skillsOnly} variant="secondary" />
          <KeywordGroup title="Missing Core Keywords" values={result.keywords.missingCore} variant="destructive" />
          <KeywordGroup title="Missing Common Keywords" values={result.keywords.missingCommon} variant="outline" />
          {result.keywords.missingCore.length > 0 && (
            <p className="text-sm text-muted-foreground">
              Указывай отсутствующие технологии только при наличии реального опыта. Если опыт действительно есть, покажи
              его в описании работы или проекта.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SlidersHorizontal className="h-5 w-5" />
            Структурированные фильтры
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {(
            Object.entries(result.structuredFilters) as Array<
              [keyof AtsAnalysisResult["structuredFilters"], FilterAssessment]
            >
          ).map(([key, filter]) => (
            <div key={key} className="rounded-lg border p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium">{FILTER_LABELS[key]}</span>
                <Badge
                  variant={
                    filter.status === "mismatch" ? "destructive" : filter.status === "match" ? "success" : "secondary"
                  }
                >
                  {STATUS_LABELS[filter.status]}
                </Badge>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {filter.evidence ?? "Информация в резюме не найдена"}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      {result.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Рекомендации</CardTitle>
            <CardDescription>Основаны на фактах из резюме</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {result.recommendations.map((item, index) => (
              <div key={`${item.section}-${index}`} className="rounded-lg border p-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium">{item.problem}</p>
                  <Badge variant="secondary">{item.priority}</Badge>
                </div>
                <p className="mt-1 text-sm">{item.recommendation}</p>
                {item.example && <p className="mt-2 rounded bg-secondary/40 p-2 text-sm">Пример: {item.example}</p>}
                {item.evidence && <p className="mt-2 text-xs text-muted-foreground">Основание: {item.evidence}</p>}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ScoreRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="grid grid-cols-[minmax(150px,1fr)_minmax(100px,2fr)_70px] items-center gap-3">
      <span className="text-sm">{label}</span>
      <Progress value={value} />
      <span className="text-right font-medium">{value}/100</span>
    </div>
  );
}

function SummaryCard({ icon, title, items }: { icon: React.ReactNode; title: string; items: string[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {items.length > 0 ? (
          <ul className="list-disc space-y-2 pl-5 text-sm">
            {items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">Нет подтверждённых пунктов</p>
        )}
      </CardContent>
    </Card>
  );
}

function KeywordGroup({
  title,
  values,
  variant,
}: {
  title: string;
  values: string[];
  variant: "success" | "secondary" | "destructive" | "outline";
}) {
  return (
    <div>
      <p className="mb-2 text-sm font-medium">{title}</p>
      {values.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {values.map((value) => (
            <Badge key={value} variant={variant}>
              {value}
            </Badge>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Нет</p>
      )}
    </div>
  );
}
