import * as React from "react";
import { Activity, BarChart3, Copy, Download } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { saveToHistory } from "@/lib/utils/storage";
import { useToast } from "@/hooks/useToast";
import type { HistoryEntry } from "@/types";
import type { AtsAnalysisResult } from "@/types/ats";
import { AtsResultDisplay } from "./AtsResultDisplay";

interface ResultDisplayProps {
  result: string;
  file: File;
  model: string;
  atsResult?: AtsAnalysisResult;
}

type JsonObject = Record<string, unknown>;

const FIELD_LABELS: Record<string, string> = {
  level: "Уровень",
  candidateStrength: "Сила кандидата",
  resumeQuality: "Качество резюме",
  hrChance: "Шанс пройти HR",
  hrScreeningChance: "Шанс пройти HR",
  technicalInterviewChance: "Шанс технического интервью",
  java: "Java",
  spring: "Spring",
  backend: "Backend",
  sql: "PostgreSQL / SQL",
  postgresqlSql: "PostgreSQL / SQL",
  jpaHibernate: "JPA / Hibernate",
  infrastructure: "Инфраструктура",
  commercialExperience: "Коммерческий опыт",
  experienceDescription: "Описание опыта",
  levelMatch: "Соответствие уровню",
  ats: "ATS / hh.ru",
  score: "Оценка",
  confirmedTechnologies: "Подтверждённые технологии",
  technologies: "Технологии",
  improvements: "Что улучшить",
  whatToImprove: "Что улучшить",
  rewrite: "Переписать",
  before: "Было",
  original: "Было",
  problem: "Проблема",
  better: "Лучше",
  improved: "Лучше",
};

const ENUM_LABELS: Record<string, string> = {
  junior: "Junior",
  junior_middle: "Junior/Middle",
  middle: "Middle",
  middle_senior: "Middle/Senior",
  senior: "Senior",
  low: "Низкий",
  medium: "Средний",
  high: "Высокий",
  very_high: "Очень высокий",
  yes: "Да",
  no: "Нет",
};

const SECTION_KEYS = new Set([
  "level",
  "scores",
  "strengths",
  "problems",
  "experienceAnalysis",
  "recommendedVacancies",
  "beforeMassApplications",
  "studyPriority",
  "notNeededNow",
]);
const SUMMARY_SCORE_KEYS = new Set([
  "candidateStrength",
  "resumeQuality",
  "hrChance",
  "hrScreeningChance",
  "technicalInterviewChance",
]);

const isObject = (value: unknown): value is JsonObject =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isPresent = (value: unknown): boolean => {
  if (value === null || value === undefined || value === "") return false;
  if (Array.isArray(value)) return value.some(isPresent);
  if (isObject(value)) return Object.values(value).some(isPresent);
  return true;
};

const humanizeKey = (key: string): string =>
  FIELD_LABELS[key] ??
  key
    .replace(/([a-z\d])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/^./, (letter) => letter.toUpperCase());

const humanizeValue = (value: unknown): string => {
  if (typeof value === "boolean") return value ? "Да" : "Нет";
  if (typeof value === "string") return ENUM_LABELS[value.toLowerCase()] ?? value;
  return String(value);
};

const formatScore = (value: unknown): string => {
  if (typeof value === "number") return `${value}/10`;
  if (typeof value === "string" && /^\d+(?:[.,]\d+)?$/.test(value.trim())) return `${value}/10`;
  if (isObject(value)) {
    const score = value.score ?? value.value;
    const details = Object.entries(value)
      .filter(([key, item]) => key !== "score" && key !== "value" && isPresent(item))
      .map(([, item]) => humanizeValue(item));
    return [isPresent(score) ? formatScore(score) : "", ...details].filter(Boolean).join(" — ");
  }
  return humanizeValue(value);
};

const markdownList = (items: unknown[], ordered = false): string =>
  items
    .filter(isPresent)
    .map((item, index) => `${ordered ? `${index + 1}.` : "-"} ${humanizeValue(item)}`)
    .join("\n");

const recordTitle = (record: JsonObject, index: number): string => {
  const company = record.company ?? record.employer ?? record.project;
  const role = record.role ?? record.position ?? record.title ?? record.vacancy;
  if (company && role) return `${humanizeValue(company)} — ${humanizeValue(role)}`;
  if (company || role) return humanizeValue(company ?? role);
  return `Пункт ${index + 1}`;
};

const renderObject = (record: JsonObject, headingLevel = 3): string => {
  const chunks: string[] = [];
  for (const [key, value] of Object.entries(record)) {
    if (!isPresent(value) || ["company", "employer", "project", "role", "position", "title", "vacancy"].includes(key))
      continue;
    const label = humanizeKey(key);
    if (Array.isArray(value)) {
      const body = value.every((item) => !isObject(item))
        ? markdownList(value)
        : value
            .map((item, index) =>
              isObject(item)
                ? `${"#".repeat(headingLevel + 1)} ${recordTitle(item, index)}\n\n${renderObject(item, headingLevel + 2)}`
                : `- ${humanizeValue(item)}`,
            )
            .join("\n\n");
      chunks.push(`${"#".repeat(headingLevel)} ${label}\n\n${body}`);
    } else if (isObject(value)) {
      chunks.push(`${"#".repeat(headingLevel)} ${label}\n\n${renderObject(value, headingLevel + 1)}`);
    } else {
      chunks.push(`**${label}:** ${key.toLowerCase().includes("score") ? formatScore(value) : humanizeValue(value)}`);
    }
  }
  return chunks.join("\n\n");
};

const renderSection = (title: string, value: unknown, ordered = false): string => {
  if (!isPresent(value)) return "";
  if (Array.isArray(value)) {
    const body = value.every((item) => !isObject(item))
      ? markdownList(value, ordered)
      : value
          .map((item, index) =>
            isObject(item)
              ? `### ${recordTitle(item, index)}\n\n${renderObject(item, 4)}`
              : `${ordered ? `${index + 1}.` : "-"} ${humanizeValue(item)}`,
          )
          .join("\n\n");
    return `## ${title}\n\n${body}`;
  }
  if (isObject(value)) return `## ${title}\n\n${renderObject(value, 3)}`;
  return `## ${title}\n\n${humanizeValue(value)}`;
};

const parseStructuredResult = (result: string): JsonObject | null => {
  const json = result
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/\s*```$/, "");
  try {
    const parsed: unknown = JSON.parse(json);
    return isObject(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

// Exported for backward-compatibility tests of persisted history entries.
// eslint-disable-next-line react-refresh/only-export-components
export const formatAnalysisMarkdown = (result: string): string => {
  const analysis = parseStructuredResult(result);
  if (!analysis) {
    return result.trim().startsWith("{")
      ? "# Анализ резюме\n\nНе удалось обработать структурированный ответ модели."
      : result;
  }

  const scores = isObject(analysis.scores) ? analysis.scores : {};
  const summarySources = { ...scores, ...analysis };
  const summaryFields: [string, string][] = [
    ["level", "Уровень"],
    ["candidateStrength", "Сила кандидата"],
    ["resumeQuality", "Качество резюме"],
    ["hrChance", "Шанс пройти HR"],
    ["hrScreeningChance", "Шанс пройти HR"],
    ["technicalInterviewChance", "Шанс технического интервью"],
  ];
  const displayedSummaryLabels = new Set<string>();
  const summary = summaryFields.flatMap(([key, label]) => {
    const value = summarySources[key];
    if (!isPresent(value) || displayedSummaryLabels.has(label)) return [];
    displayedSummaryLabels.add(label);
    const formatted =
      key === "candidateStrength" || key === "resumeQuality" ? formatScore(value) : humanizeValue(value);
    return [`**${label}:** ${formatted}`];
  });

  const scoreRows = Object.entries(scores)
    .filter(([key, value]) => !SUMMARY_SCORE_KEYS.has(key) && isPresent(value))
    .map(
      ([key, value]) => `| ${humanizeKey(key).split("|").join("\\|")} | ${formatScore(value).split("|").join("\\|")} |`,
    );

  const sections = [
    "# Анализ резюме",
    summary.join("  \n"),
    scoreRows.length ? `## Оценки\n\n| Критерий | Оценка |\n|---|---:|\n${scoreRows.join("\n")}` : "",
    renderSection("Сильные стороны", analysis.strengths),
    renderSection("Проблемы", analysis.problems),
    renderSection("Анализ опыта", analysis.experienceAnalysis),
    renderSection("Подходящие вакансии", analysis.recommendedVacancies),
    renderSection("Перед массовыми откликами", analysis.beforeMassApplications),
    renderSection("Что изучать", analysis.studyPriority, true),
    renderSection("Пока не требуется", analysis.notNeededNow),
  ];

  const additional = Object.fromEntries(
    Object.entries(analysis).filter(
      ([key, value]) => !SECTION_KEYS.has(key) && !SUMMARY_SCORE_KEYS.has(key) && isPresent(value),
    ),
  );
  if (isPresent(additional)) sections.push(renderSection("Дополнительно", additional));
  return sections.filter(Boolean).join("\n\n");
};

const markdownComponents = {
  h1: ({ children }: React.PropsWithChildren) => <h1 className="mb-3 mt-5 text-2xl font-bold">{children}</h1>,
  h2: ({ children }: React.PropsWithChildren) => <h2 className="mb-2 mt-5 text-xl font-semibold">{children}</h2>,
  h3: ({ children }: React.PropsWithChildren) => <h3 className="mb-2 mt-4 text-lg font-semibold">{children}</h3>,
  h4: ({ children }: React.PropsWithChildren) => <h4 className="mb-2 mt-3 font-semibold">{children}</h4>,
  p: ({ children }: React.PropsWithChildren) => <p className="my-2 leading-7">{children}</p>,
  ul: ({ children }: React.PropsWithChildren) => <ul className="my-2 list-disc space-y-1 pl-6">{children}</ul>,
  ol: ({ children }: React.PropsWithChildren) => <ol className="my-2 list-decimal space-y-1 pl-6">{children}</ol>,
  a: ({ children, ...props }: React.ComponentPropsWithoutRef<"a">) => (
    <a {...props} className="text-primary underline" target="_blank" rel="noreferrer">
      {children}
    </a>
  ),
  pre: ({ children }: React.PropsWithChildren) => (
    <pre className="my-3 overflow-x-auto rounded bg-background p-3 text-sm">{children}</pre>
  ),
  code: ({ children, className }: React.ComponentPropsWithoutRef<"code">) => (
    <code className={`${className ?? ""} rounded bg-background px-1 py-0.5 font-mono text-sm`}>{children}</code>
  ),
  table: ({ children }: React.PropsWithChildren) => (
    <div className="my-3 overflow-x-auto">
      <table className="w-full border-collapse text-sm">{children}</table>
    </div>
  ),
  th: ({ children }: React.PropsWithChildren) => <th className="border p-2 text-left font-semibold">{children}</th>,
  td: ({ children }: React.PropsWithChildren) => <td className="border p-2 align-top">{children}</td>,
};

export function ResultDisplay({ result, file, model, atsResult }: ResultDisplayProps) {
  const { addToast } = useToast();
  const [activeSection, setActiveSection] = React.useState<"basic" | "ats">("basic");
  const markdown = React.useMemo(() => formatAnalysisMarkdown(result), [result]);

  const handleCopy = () => {
    navigator.clipboard.writeText(markdown);
    addToast({ title: "Скопировано", description: "Ответ скопирован в буфер обмена", variant: "success" });
  };

  const download = (extension: "md" | "txt", mimeType: string) => {
    const timestamp = new Date().toISOString().split("T")[0];
    const blob = new Blob([markdown], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `resume-analysis-${timestamp}.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    addToast({ title: "Скачано", description: `Файл ${extension.toUpperCase()} загружен`, variant: "success" });
  };

  const handleSaveToHistory = () => {
    const entry: Omit<HistoryEntry, "id" | "createdAt"> & { result: string } = {
      fileName: file.name,
      model,
      result: markdown,
      atsResult: atsResult ? JSON.stringify(atsResult) : undefined,
    };
    saveToHistory(entry);
    addToast({ title: "Сохранено", description: "Результат сохранен в историю", variant: "success" });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Анализ завершен</h2>
          <p className="text-muted-foreground">Файл: {file.name}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={handleCopy}>
            <Copy className="mr-2 h-4 w-4" />
            Копировать
          </Button>
          <Button variant="outline" size="sm" onClick={() => download("md", "text/markdown")}>
            <Download className="mr-2 h-4 w-4" />
            .md
          </Button>
          <Button variant="outline" size="sm" onClick={() => download("txt", "text/plain")}>
            <Download className="mr-2 h-4 w-4" />
            .txt
          </Button>
          <Button variant="outline" size="sm" onClick={handleSaveToHistory}>
            <Activity className="mr-2 h-4 w-4" />
            Сохранить
          </Button>
        </div>
      </div>

      <div className="flex gap-2 border-b">
        <Button
          variant={activeSection === "basic" ? "secondary" : "ghost"}
          className="h-9"
          onClick={() => setActiveSection("basic")}
        >
          Базовый анализ
        </Button>
        {atsResult && (
          <Button
            variant={activeSection === "ats" ? "secondary" : "ghost"}
            className="h-9"
            onClick={() => setActiveSection("ats")}
          >
            <BarChart3 className="mr-2 h-4 w-4" />
            ATS анализ
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Результаты анализа</CardTitle>
          <CardDescription>
            {file.name} • Модель: {model}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activeSection === "ats" && atsResult ? (
            <AtsResultDisplay result={atsResult} />
          ) : (
            <div className="rounded-lg border bg-secondary/20 p-4">
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                {markdown}
              </ReactMarkdown>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
