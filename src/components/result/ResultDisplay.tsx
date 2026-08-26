import * as React from 'react';
import { Download, Copy, Activity, Award, TrendingUp, AlertCircle, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { parseMarkdownResponse, type AnalysisResult } from '@/lib/utils/helpers';
import { saveToHistory } from '@/lib/utils/storage';
import { useToast } from '@/hooks/useToast';
import type { HistoryEntry } from '@/types';

interface ResultDisplayProps {
  result: string;
  file: File;
  model: string;
}

export function ResultDisplay({ result, file, model }: ResultDisplayProps) {
  const { addToast } = useToast();
  const [parsedResult, setParsedResult] = React.useState<AnalysisResult | null>(null);
  const [showRaw, setShowRaw] = React.useState(false);
  const [expandedSections, setExpandedSections] = React.useState<Set<string>>(new Set(['problems', 'recommendations']));

  React.useEffect(() => {
    try {
      const parsed = parseMarkdownResponse(result);
      setParsedResult({
        markdown: result,
        overallScore: parsed.overallScore,
        candidateLevel: parsed.candidateLevel,
        skills: parsed.skills,
        problems: parsed.problems,
        recommendations: parsed.recommendations,
        finalVerdict: parsed.finalVerdict,
      });
    } catch (error) {
      console.error('Failed to parse result:', error);
    }
  }, [result]);

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    addToast({
      title: 'Скопировано',
      description: 'Ответ скопирован в буфер обмена',
      variant: 'success',
    });
  };

  const handleDownloadMarkdown = () => {
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `resume-analysis-${timestamp}.md`;
    const blob = new Blob([result], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    addToast({
      title: 'Скачано',
      description: 'Файл Markdown загружен',
      variant: 'success',
    });
  };

  const handleDownloadText = () => {
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `resume-analysis-${timestamp}.txt`;
    const blob = new Blob([result], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    addToast({
      title: 'Скачано',
      description: 'Файл TXT загружен',
      variant: 'success',
    });
  };

  const handleSaveToHistory = () => {
    const entry: Omit<HistoryEntry, 'id' | 'createdAt'> & { result: string } = {
      fileName: file.name,
      model,
      result,
    };
    saveToHistory(entry);
    addToast({
      title: 'Сохранено',
      description: 'Результат сохранен в историю',
      variant: 'success',
    });
  };

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  if (!parsedResult) {
    return (
      <Card>
        <CardContent className="flex h-64 items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-muted-foreground">Обработка результата...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

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
          <Button variant="outline" size="sm" onClick={handleDownloadMarkdown}>
            <Download className="mr-2 h-4 w-4" />
            .md
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownloadText}>
            <Download className="mr-2 h-4 w-4" />
            .txt
          </Button>
          <Button variant="outline" size="sm" onClick={handleSaveToHistory}>
            <Activity className="mr-2 h-4 w-4" />
            Сохранить
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Результаты анализа</CardTitle>
          <CardDescription>{file.name} • Модель: {model}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Итоговая оценка</h3>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-4xl font-bold">
                  {parsedResult.overallScore || 0}/10
                </div>
                <Progress value={(parsedResult.overallScore || 0) * 10} className="flex-1" />
              </div>
              <div className="text-sm text-muted-foreground">
                Уровень кандидата: <strong>{parsedResult.candidateLevel || 'Определите по описанию'}</strong>
              </div>
            </div>

            {parsedResult.skills && parsedResult.skills.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Оценка навыков</h3>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {parsedResult.skills.map((skill) => (
                    <div key={skill.name} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>{skill.name}</span>
                        <span className="font-medium">{skill.score}/10</span>
                      </div>
                      <Progress value={skill.score * 10} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {parsedResult.finalVerdict && (
              <div className="space-y-4 rounded-lg border bg-secondary/20 p-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Финальный вердикт</h3>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">HR-скрининг</div>
                    <Badge variant={parsedResult.finalVerdict.hrScreening === 'High' ? 'success' : 'secondary'}>
                      {parsedResult.finalVerdict.hrScreening}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">Техническое интервью</div>
                    <Badge variant={parsedResult.finalVerdict.technicalInterview === 'High' ? 'success' : 'secondary'}>
                      {parsedResult.finalVerdict.technicalInterview}
                    </Badge>
                  </div>
                </div>
              </div>
            )}

            {parsedResult.problems && parsedResult.problems.length > 0 && (
              <div className="space-y-2">
                <div 
                  className="flex cursor-pointer items-center justify-between"
                  onClick={() => toggleSection('problems')}
                >
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-destructive" />
                    <h3 className="font-semibold">Проблемы резюме</h3>
                  </div>
                  {expandedSections.has('problems') ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </div>
                {expandedSections.has('problems') && parsedResult.problems && parsedResult.problems.length > 0 && (
                  <div className="space-y-2 pl-2">
                    {parsedResult.problems.map((problem, idx) => (
                      <div key={problem} className="flex gap-2 text-sm">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-xs font-medium text-destructive">
                          {idx + 1}
                        </span>
                        <p className="text-muted-foreground">{problem}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {parsedResult.recommendations && parsedResult.recommendations.length > 0 && (
              <div className="space-y-2">
                <div 
                  className="flex cursor-pointer items-center justify-between"
                  onClick={() => toggleSection('recommendations')}
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <h3 className="font-semibold">Рекомендации</h3>
                  </div>
                  {expandedSections.has('recommendations') ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </div>
                {expandedSections.has('recommendations') && parsedResult.recommendations && parsedResult.recommendations.length > 0 && (
                  <div className="space-y-2 pl-2">
                    {parsedResult.recommendations.map((rec, idx) => (
                      <div key={rec} className="flex gap-2 text-sm">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-500/10 text-xs font-medium text-green-500">
                          {idx + 1}
                        </span>
                        <p className="text-muted-foreground">{rec}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Полный текст анализа</h3>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setShowRaw(!showRaw)}>
                  {showRaw ? 'Свернуть' : 'Показать'}
                </Button>
              </div>
              {showRaw && (
                <div className="rounded-lg border bg-secondary/20 p-4 max-h-96 overflow-y-auto">
                  <pre className="whitespace-pre-wrap font-mono text-sm">{result}</pre>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
