import * as React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Activity, Copy, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/useToast";
import { getAiProviderLabel } from "@/lib/ai/providers";
import { getAnalysisProfileLabel, getCriterionLabel } from "@/lib/analysis-profiles";
import { formatAnalysisMarkdown } from "@/lib/analysis-result-format";
import type { CandidateLevel, CriterionAssessment, InterviewChance, ResumeAnalysisResult } from "@/types/resume-analysis";
import type { VacancyAnalysisContext } from "@/types/vacancy";

interface ResultDisplayProps {
  result: ResumeAnalysisResult | null;
  legacyMarkdown?: string | null;
  file: File;
  onSave?: (fileName: string, result: ResumeAnalysisResult) => void;
  analysisContext?: VacancyAnalysisContext;
}

const LEVEL_LABELS: Record<CandidateLevel, string> = {
  junior: "Junior",
  junior_plus: "Junior+",
  middle_minus: "Middle−",
  middle: "Middle",
};

const CHANCE_LABELS: Record<InterviewChance, string> = { LOW: "Низкая", MEDIUM: "Средняя", HIGH: "Высокая" };

export function ResultDisplay({ result, legacyMarkdown, file, onSave, analysisContext }: ResultDisplayProps) {
  const { addToast } = useToast();
  const markdown = React.useMemo(() => result ? formatAnalysisMarkdown(result) : legacyMarkdown ?? "", [result, legacyMarkdown]);

  const handleCopy = () => {
    void navigator.clipboard.writeText(markdown);
    addToast({ title: "Скопировано", description: "Результат скопирован в буфер обмена", variant: "success" });
  };

  const download = (extension: "md" | "txt", mimeType: string) => {
    const blob = new Blob([markdown], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `resume-analysis-${new Date().toISOString().split("T")[0]}.${extension}`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const save = () => {
    if (!result) return;
    onSave?.(file.name, result);
    addToast({ title: "Сохранено", description: "Результат сохранён в историю", variant: "success" });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div><h2 className="text-2xl font-bold">Анализ завершён</h2><p className="text-muted-foreground">Файл: {file.name}</p></div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={handleCopy}><Copy className="mr-2 h-4 w-4" />Копировать</Button>
          <Button variant="outline" size="sm" onClick={() => download("md", "text/markdown")}><Download className="mr-2 h-4 w-4" />.md</Button>
          <Button variant="outline" size="sm" onClick={() => download("txt", "text/plain")}><Download className="mr-2 h-4 w-4" />.txt</Button>
          {result && onSave && <Button variant="outline" size="sm" onClick={save}><Activity className="mr-2 h-4 w-4" />Сохранить</Button>}
        </div>
      </div>

      {result ? <BackendResult result={result} analysisContext={analysisContext} /> : (
        <Card><CardHeader><CardTitle>Сохранённый анализ</CardTitle><CardDescription>Результат из legacy frontend</CardDescription></CardHeader>
          <CardContent className="prose max-w-none"><ReactMarkdown remarkPlugins={[remarkGfm]}>{legacyMarkdown}</ReactMarkdown></CardContent>
        </Card>
      )}
    </div>
  );
}

function BackendResult({ result, analysisContext }: { result: ResumeAnalysisResult; analysisContext?: VacancyAnalysisContext }) {
  const provider = getAiProviderLabel(result.metadata.provider);
  const profile = getAnalysisProfileLabel(result.metadata.analysisProfile);
  return <>
    {result.market.source === "selected_vacancies" && <Card><CardContent className="pt-6"><p className="font-medium">{getMarketContext(result, analysisContext)}</p></CardContent></Card>}
    <Card>
      <CardHeader><CardTitle>{result.targetRole}</CardTitle><CardDescription>
        Профиль: {profile} · AI provider: {provider}{result.metadata.model ? ` · Модель: ${result.metadata.model}` : ""} · Версия: {result.metadata.analysisVersion}
      </CardDescription></CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Оценочный уровень" value={LEVEL_LABELS[result.detectedLevel]} />
        <Metric label="Общая оценка" value={`${result.overallScore}/100`} />
        <Metric label="Сила кандидата" value={`${result.candidateStrength}/100`} />
        <Metric label="Коммерческий опыт" value={`${result.experience.commercialYears} г. ${result.experience.remainingMonths} мес.`} />
        <Metric label="Вероятность HR-скрининга" value={CHANCE_LABELS[result.hrScreeningChance]} />
        <Metric label="Вероятность технического интервью" value={CHANCE_LABELS[result.technicalInterviewChance]} />
        <Metric label="Источник рынка" value={result.market.source === "selected_vacancies" ? "Выбранные вакансии" : result.market.source} />
        <Metric label="Выборка рынка" value={String(result.market.sampleSize)} />
      </CardContent>
    </Card>

    <Card><CardHeader><CardTitle>Техническое соответствие</CardTitle></CardHeader><CardContent className="space-y-4">
      {result.scores.assessments.length > 0
        ? result.scores.assessments.map((assessment) => <CriterionScore key={assessment.criterionId} assessment={assessment} />)
        : <p className="text-sm text-muted-foreground">Технические критерии не получены.</p>}
    </CardContent></Card>

    <Card><CardHeader><CardTitle>Резюме и опыт</CardTitle></CardHeader><CardContent className="space-y-4">
      <ScoreRow label="Коммерческий опыт" value={result.scores.commercialExperience} max={10} />
      <ScoreRow label="Качество описания опыта" value={result.scores.experienceDescription} max={10} />
      <ScoreRow label="ATS readability" value={result.scores.ats} max={100} />
      <ScoreRow label="Качество резюме" value={result.scores.resumeQuality} max={100} />
    </CardContent></Card>

    <div className="grid gap-4 md:grid-cols-2"><ListCard title="Сильные стороны" items={result.strengths} /><ListCard title="Слабые стороны" items={result.weaknesses} /></div>
    <div className="grid gap-4 md:grid-cols-3">
      <BadgeCard title="Подтверждено" items={result.skills.confirmed} />
      <BadgeCard title="Слабые подтверждения" items={result.skills.weakEvidence} />
      <BadgeCard title="Не найдено в резюме" description="Часто встречается в вакансиях, но не найдено в резюме" items={result.skills.missing} variant="outline" />
    </div>
    <ListCard title="ATS-проблемы" items={result.atsIssues} />
    <ListCard title="Рекомендации" items={result.recommendations} />
    {result.vacancyFit && <VacancyFitSection fit={result.vacancyFit} />}
    {result.warnings.length > 0 && <ListCard title="Предупреждения" items={result.warnings} />}
    <p className="text-xs text-muted-foreground">
      Сформировано: {result.metadata.generatedAt} · Baseline: {result.metadata.baselineVersion}
      {result.metadata.marketProfileVersion ? ` · Market profile: ${result.metadata.marketProfileVersion}` : ""}
      {result.metadata.marketProfileSource ? ` (${result.metadata.marketProfileSource})` : ""}
    </p>
  </>;
}

export function CriterionScore({ assessment }: { assessment: CriterionAssessment }) {
  const label = getCriterionLabel(assessment.criterionId);
  return <section className="rounded-md border p-4">
    <ScoreRow label={label} value={assessment.score} max={10} />
    <div className="mt-3">
      <h4 className="text-sm font-medium">Подтверждения</h4>
      {assessment.evidence.length > 0
        ? <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">{assessment.evidence.map((item, index) => <li key={`${assessment.criterionId}-${index}`}>{item}</li>)}</ul>
        : <p className="mt-1 text-sm text-muted-foreground">Недостаточно подтверждённых данных</p>}
    </div>
  </section>;
}

function VacancyFitSection({ fit }: { fit: NonNullable<ResumeAnalysisResult["vacancyFit"]> }) {
  const levelLabels: Record<string, string> = { MATCH: "Соответствует", PARTIAL: "Частично соответствует", MISMATCH: "Не соответствует" };
  return <Card><CardHeader><CardTitle>Соответствие вакансии</CardTitle></CardHeader><CardContent className="space-y-5">
    <div className="grid gap-4 sm:grid-cols-2"><Metric label="Соответствие уровню" value={levelLabels[fit.candidateLevelFit] ?? fit.candidateLevelFit} /><Metric label="Релевантность опыта" value={`${fit.experienceRelevanceScore} / 10`} /></div>
    <FitBadges title="Обязательные навыки" items={fit.requiredSkills} />
    <FitBadges title="Дополнительные навыки" items={fit.optionalSkills} />
    <FitBadges title="Не найдено в резюме" items={fit.missingSkills} variant="outline" />
    <FitList title="Риски" items={fit.risks} />
    <FitList title="Возможные причины отказа" items={fit.probableRejectionReasons} />
  </CardContent></Card>;
}

function FitBadges({ title, items, variant = "secondary" }: { title: string; items: string[]; variant?: "secondary" | "outline" }) {
  if (items.length === 0) return null;
  return <section><h4 className="mb-2 text-sm font-semibold">{title}</h4><div className="flex flex-wrap gap-2">{items.map((item) => <Badge key={item} variant={variant}>{item}</Badge>)}</div></section>;
}

function FitList({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return <section><h4 className="mb-2 text-sm font-semibold">{title}</h4><ul className="list-disc space-y-1 pl-5 text-sm">{items.map((item) => <li key={item}>{item}</li>)}</ul></section>;
}

const getMarketContext = (result: ResumeAnalysisResult, context?: VacancyAnalysisContext): string => {
  if (result.market.sampleSize === 1) {
    const vacancy = [context?.vacancyTitle, context?.vacancyCompany].filter(Boolean).join(" — ");
    return vacancy ? `Анализ выполнен по выбранной вакансии: ${vacancy}` : "Анализ выполнен по выбранной вакансии";
  }
  return `Анализ выполнен по ${result.market.sampleSize} выбранным вакансиям`;
};

function Metric({ label, value }: { label: string; value: string }) { return <div className="min-w-0"><p className="text-xs text-muted-foreground">{label}</p><p className="break-words font-semibold">{value}</p></div>; }
function ScoreRow({ label, value, max }: { label: string; value: number; max: 10 | 100 }) {
  return <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(100px,2fr)_70px] sm:items-center sm:gap-3">
    <span className="min-w-0 break-words text-sm">{label}</span>
    <Progress aria-label={`${label}: ${value} из ${max}`} value={max === 10 ? value * 10 : value} />
    <span className="text-right font-medium">{value}/{max}</span>
  </div>;
}
function ListCard({ title, items }: { title: string; items: string[] }) { return <Card><CardHeader><CardTitle>{title}</CardTitle></CardHeader><CardContent>{items.length ? <ul className="list-disc space-y-2 pl-5 text-sm">{items.map((item) => <li key={item}>{item}</li>)}</ul> : <p className="text-sm text-muted-foreground">Нет</p>}</CardContent></Card>; }
function BadgeCard({ title, description, items, variant = "secondary" }: { title: string; description?: string; items: string[]; variant?: "secondary" | "outline" }) {
  return <Card><CardHeader><CardTitle>{title}</CardTitle>{description && <CardDescription>{description}</CardDescription>}</CardHeader><CardContent className="flex flex-wrap gap-2">{items.length ? items.map((item) => <Badge key={item} variant={variant}>{item}</Badge>) : <span className="text-sm text-muted-foreground">Нет</span>}</CardContent></Card>;
}
