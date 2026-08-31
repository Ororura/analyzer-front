import * as React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Activity, Copy, Download } from "lucide-react";
import { AnalysisDashboard } from "./AnalysisDashboard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/useToast";
import { formatAnalysisMarkdown } from "@/lib/analysis-result-format";
import { levelLabels } from "@/lib/analysis-presentation";
import { getAiProviderLabel } from "@/lib/ai/providers";
import { getCriterionLabel } from "@/lib/analysis-profiles";
import type { ResumeAnalysisResult } from "@/types/resume-analysis";
import type { VacancyAnalysisContext } from "@/types/vacancy";

interface ResultDisplayProps {
  result: ResumeAnalysisResult | null;
  legacyMarkdown?: string | null;
  file: File;
  onSave?: (fileName: string, result: ResumeAnalysisResult) => void;
  analysisContext?: VacancyAnalysisContext;
}

export function ResultDisplay({ result, legacyMarkdown, file, onSave, analysisContext }: ResultDisplayProps) {
  const { addToast } = useToast();
  const markdown = React.useMemo(() => result?.markdownReport ?? (result ? formatAnalysisMarkdown(result) : legacyMarkdown ?? ""), [result, legacyMarkdown]);
  const download = (extension: "md" | "txt", mimeType: string) => {
    const url = URL.createObjectURL(new Blob([markdown], { type: mimeType }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `resume-analysis-${new Date().toISOString().split("T")[0]}.${extension}`;
    link.click();
    URL.revokeObjectURL(url);
  };
  const isStructured = Boolean(result && ((result.metadata.analysisSchemaVersion ?? 0) >= 2
    || result.marketFit || result.technicalProfile || result.ats || result.risks?.length));

  return <div className="space-y-6">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div><h1 className="text-2xl font-bold">Анализ резюме</h1><p className="text-muted-foreground">Файл: {file.name}</p></div>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={() => { void navigator.clipboard.writeText(markdown); addToast({ title: "Скопировано", description: "Отчёт скопирован в буфер обмена", variant: "success" }); }}><Copy className="mr-2 h-4 w-4" />Копировать</Button>
        <Button variant="outline" size="sm" onClick={() => download("md", "text/markdown")}><Download className="mr-2 h-4 w-4" />.md</Button>
        <Button variant="outline" size="sm" onClick={() => download("txt", "text/plain")}><Download className="mr-2 h-4 w-4" />.txt</Button>
        {result && onSave && <Button variant="outline" size="sm" onClick={() => { onSave(file.name, result); addToast({ title: "Сохранено", description: "Результат сохранён в историю", variant: "success" }); }}><Activity className="mr-2 h-4 w-4" />Сохранить</Button>}
      </div>
    </div>
    {result && analysisContext?.mode === "SINGLE_VACANCY" && <Card><CardContent className="pt-6 text-sm font-medium">Анализ выполнен по выбранной вакансии: {[analysisContext.vacancyTitle, analysisContext.vacancyCompany].filter(Boolean).join(" — ") || "выбранная вакансия"}</CardContent></Card>}
    {result ? (isStructured ? <AnalysisDashboard result={result} /> : <LegacyAnalysis result={result} />) : <Card><CardHeader><CardTitle>Сохранённый анализ</CardTitle></CardHeader><CardContent className="prose max-w-none"><ReactMarkdown remarkPlugins={[remarkGfm]}>{legacyMarkdown}</ReactMarkdown></CardContent></Card>}
  </div>;
}

function LegacyAnalysis({ result }: { result: ResumeAnalysisResult }) {
  return <div className="space-y-4">
    <Card><CardHeader><CardTitle>{result.targetRole}</CardTitle><p className="text-sm text-muted-foreground">AI provider: {getAiProviderLabel(result.metadata.provider)}{result.metadata.model ? ` · Модель: ${result.metadata.model}` : ""}</p></CardHeader><CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Metric label="Уровень" value={levelLabels[result.detectedLevel]} /><Metric label="Общая оценка" value={`${result.overallScore}/100`} /><Metric label="Сила кандидата" value={`${result.candidateStrength}/100`} /><Metric label="Опыт" value={`${result.experience.commercialYears} г. ${result.experience.remainingMonths} мес.`} /></CardContent></Card>
    <Card><CardHeader><CardTitle className="text-lg">Техническое соответствие</CardTitle></CardHeader><CardContent className="space-y-4">{result.scores.assessments.map((item) => <div key={item.criterionId} className="space-y-2"><div className="flex justify-between text-sm"><span>{getCriterionLabel(item.criterionId)}</span><span>{item.score}/10</span></div><Progress aria-label={`${item.criterionId}: ${item.score} из 10`} value={item.score * 10} />{item.evidence.length ? <ul className="list-disc pl-5 text-sm text-muted-foreground">{item.evidence.map((evidence, index) => <li key={index}>{evidence}</li>)}</ul> : <p className="text-sm text-muted-foreground">Недостаточно подтверждённых данных</p>}</div>)}</CardContent></Card>
    <Card><CardHeader><CardTitle className="text-lg">ATS readability</CardTitle></CardHeader><CardContent className="space-y-2"><div className="flex justify-between text-sm"><span>ATS</span><span>{result.scores.ats}/100</span></div><Progress aria-label={`ATS: ${result.scores.ats} из 100`} value={result.scores.ats} /></CardContent></Card>
    <div className="grid gap-4 md:grid-cols-2"><LegacyList title="Сильные стороны" items={result.strengths} /><LegacyList title="Риски" items={[...result.weaknesses, ...result.atsIssues, ...result.warnings]} /><LegacyList title="Рекомендации" items={result.recommendations} /><Card><CardHeader><CardTitle className="text-lg">Навыки</CardTitle><p className="text-sm text-muted-foreground">Часто встречается в вакансиях, но не найдено в резюме</p></CardHeader><CardContent className="flex flex-wrap gap-2">{[...result.skills.confirmed, ...result.skills.weakEvidence, ...result.skills.missing].map((skill) => <Badge key={skill} variant="secondary">{skill}</Badge>)}</CardContent></Card></div>
    {result.vacancyFit && "candidateLevelFit" in result.vacancyFit && <LegacyVacancyFit fit={result.vacancyFit} />}
  </div>;
}
function LegacyList({ title, items }: { title: string; items: string[] }) { return <Card><CardHeader><CardTitle className="text-lg">{title}</CardTitle></CardHeader><CardContent>{items.length ? <ul className="list-disc space-y-1 pl-5 text-sm">{items.map((item, index) => <li key={index}>{item}</li>)}</ul> : <p className="text-sm text-muted-foreground">Нет</p>}</CardContent></Card>; }
function LegacyVacancyFit({ fit }: { fit: Extract<NonNullable<ResumeAnalysisResult["vacancyFit"]>, { candidateLevelFit: string }> }) { return <Card><CardHeader><CardTitle className="text-lg">Соответствие вакансии</CardTitle></CardHeader><CardContent className="space-y-3"><Metric label="Релевантность опыта" value={`${fit.experienceRelevanceScore}/10`} />{fit.requiredSkills.length > 0 && <LegacyList title="Обязательные навыки" items={fit.requiredSkills} />}{fit.optionalSkills.length > 0 && <LegacyList title="Дополнительные навыки" items={fit.optionalSkills} />}{fit.probableRejectionReasons.length > 0 && <LegacyList title="Возможные причины отказа" items={fit.probableRejectionReasons} />}</CardContent></Card>; }
function Metric({ label, value }: { label: string; value: string }) { return <div><p className="text-xs text-muted-foreground">{label}</p><p className="font-semibold">{value}</p></div>; }
