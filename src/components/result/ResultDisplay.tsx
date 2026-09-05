import { useId, useMemo, useState, type ReactNode } from 'react';
import { FileCode2, Quote } from 'lucide-react';
import { AnalysisDashboard } from './AnalysisDashboard';
import { LegacyAnalysis } from './LegacyAnalysis';
import { AnalysisHeader } from './AnalysisHeader';
import { ResumeScoreCard, InsightsCard } from './OverviewCards';
import { SkillMarketChart, MissingSkills, SkillComparisonTable } from './SkillMarketChart';
import { VacancyMatches } from './VacancyMatches';
import { MarkdownAnalysis, MarkdownContent } from './MarkdownContent';
import { ContentBoundary } from './ContentBoundary';
import { formatAnalysisMarkdown } from '@/lib/analysis-result-format';
import { getCodeExcerpt, getDashboardSkills } from '@/lib/dashboard-data';
import type { ResumeAnalysisResult } from '@/types/resume-analysis';
import type { VacancyAnalysisContext } from '@/types/vacancy';

interface ResultDisplayProps {
  result: ResumeAnalysisResult | null;
  legacyMarkdown?: string | null;
  file: File;
  onSave?: (fileName: string, result: ResumeAnalysisResult) => void;
  analysisContext?: VacancyAnalysisContext;
  onUpload?: () => void;
  onRefresh?: () => void;
  onVacancies?: () => void;
  historyContent?: ReactNode;
}
const tabs = [
  ['details', 'Подробный анализ'],
  ['recommendations', 'Рекомендации'],
  ['vacancies', 'Сравнение с вакансиями'],
  ['ats', 'ATS-проверка'],
  ['history', 'История'],
] as const;
type AnalysisTab = (typeof tabs)[number][0];

function CodeExcerpt({ markdown }: { markdown: string }) {
  const code = useMemo(() => getCodeExcerpt(markdown), [markdown]);
  if (!code) return null;
  const fence = '`'.repeat(Math.max(3, ...Array.from(code.content.matchAll(/`+/g), (match) => match[0].length + 1)));
  return (
    <section className="glass-card code-excerpt">
      <h2 className="card-heading">
        <FileCode2 size={15} />
        Пример из отчёта
      </h2>
      <MarkdownContent content={`${fence}${code.language}\n${code.content}\n${fence}`} />
    </section>
  );
}

export function ResultDisplay({
  result,
  legacyMarkdown,
  file,
  onSave,
  analysisContext,
  onUpload,
  onRefresh,
  onVacancies,
  historyContent,
}: ResultDisplayProps) {
  const [active, setActive] = useState<AnalysisTab>('details');
  const id = useId();
  const markdown = useMemo(
    () => result?.markdownReport || (result ? formatAnalysisMarkdown(result) : (legacyMarkdown ?? '')),
    [result, legacyMarkdown],
  );
  const skills = useMemo(() => (result ? getDashboardSkills(result) : []), [result]);
  const structured = Boolean(
    result &&
    ((result.metadata.analysisSchemaVersion ?? 0) >= 2 ||
      result.marketFit ||
      result.technicalProfile ||
      result.ats ||
      result.risks?.length),
  );
  const risks = result ? (result.risks?.length ? result.risks.map((risk) => risk.title) : result.weaknesses) : [];
  const recommendation = result?.recommendationAnalysis?.items[0]?.title ?? result?.recommendations[0];
  return (
    <div className="resume-dashboard">
      <AnalysisHeader
        file={file}
        result={result}
        markdown={markdown}
        onSave={onSave}
        onUpload={onUpload}
        onRefresh={onRefresh}
      />
      {analysisContext?.mode === 'SINGLE_VACANCY' && (
        <p className="analysis-context">
          Анализ выполнен по выбранной вакансии:{' '}
          {[analysisContext.vacancyTitle, analysisContext.vacancyCompany].filter(Boolean).join(' — ') ||
            'выбранная вакансия'}
        </p>
      )}
      {result && (
        <>
          <div className="overview-grid">
            <ResumeScoreCard result={result} />
            <InsightsCard title="Сильные стороны" items={result.strengths} kind="strength" />
            <InsightsCard title="Зоны роста" items={risks} kind="growth" />
          </div>
          <div className="market-grid">
            <section className="glass-card chart-card">
              <ContentBoundary key={result.metadata.generatedAt} title="Не удалось построить график">
                <SkillMarketChart skills={skills} />
              </ContentBoundary>
            </section>
            <MissingSkills skills={skills} />
            <VacancyMatches profile={result.metadata.analysisProfile} onViewAll={onVacancies} />
          </div>
        </>
      )}
      <div className="analysis-tabs" role="tablist" aria-label="Разделы анализа">
        {tabs.map(([tab, label], index) => (
          <button
            key={tab}
            type="button"
            id={`${id}-${tab}`}
            role="tab"
            aria-selected={active === tab}
            aria-controls={`${id}-${tab}-panel`}
            tabIndex={active === tab ? 0 : -1}
            onClick={() => setActive(tab)}
            onKeyDown={(event) => {
              let target: number | undefined;
              if (event.key === 'ArrowRight') target = (index + 1) % tabs.length;
              if (event.key === 'ArrowLeft') target = (index + tabs.length - 1) % tabs.length;
              if (event.key === 'Home') target = 0;
              if (event.key === 'End') target = tabs.length - 1;
              if (target !== undefined) {
                event.preventDefault();
                setActive(tabs[target][0]);
                document.getElementById(`${id}-${tabs[target][0]}`)?.focus();
              }
            }}
          >
            {label}
          </button>
        ))}
      </div>
      {tabs.map(([tab]) => (
        <div
          key={tab}
          id={`${id}-${tab}-panel`}
          role="tabpanel"
          aria-labelledby={`${id}-${tab}`}
          hidden={active !== tab}
          tabIndex={0}
        >
          {tab === 'details' ? (
            <>
              <div className="analysis-content-grid">
                <MarkdownAnalysis content={markdown} />
                <div className="details-column">
                  <SkillComparisonTable skills={skills} />
                  {recommendation && (
                    <aside className="glass-card advice-quote">
                      <Quote size={23} aria-hidden="true" />
                      <p>{recommendation}</p>
                    </aside>
                  )}
                  <ContentBoundary key={markdown} title="Не удалось отобразить пример кода">
                    <CodeExcerpt markdown={markdown} />
                  </ContentBoundary>
                  {result && (
                    <p className="analysis-source">
                      Источник рынка: {result.market.source} · Выборка: {result.market.sampleSize} вакансий
                    </p>
                  )}
                </div>
              </div>
              {result && (
                <details className="glass-card advanced-analysis">
                  <summary>Показатели и подтверждения анализа</summary>
                  {structured ? (
                    <AnalysisDashboard result={result} section="details" />
                  ) : (
                    <LegacyAnalysis result={result} />
                  )}
                </details>
              )}
            </>
          ) : tab === 'history' ? (
            (historyContent ?? <p className="glass-card">История доступна в боковой панели.</p>)
          ) : result ? (
            structured ? (
              <AnalysisDashboard result={result} section={tab} />
            ) : (
              <LegacyAnalysis result={result} section={tab} />
            )
          ) : (
            <div className="glass-card card-empty">
              Этот сохранённый отчёт содержит только Markdown. Для дополнительных показателей загрузите PDF и запустите
              новый анализ.
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
