import { ChevronDown } from 'lucide-react';
import { MarkdownAnalysis } from './MarkdownContent';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Progress } from '@/components/ui/progress';
import {
  atsStatusLabels,
  claimRecommendationLabels,
  diagnosticFieldLabels,
  effortLabels,
  evidenceStatusLabels,
  formatConfidence,
  formatCoverageGain,
  formatPercent,
  gradeFitLabels,
  humanizeKey,
  levelLabels,
  priorityLabels,
  severityLabels,
  vacancyRecommendationLabels,
} from '@/lib/analysis-presentation';
import { getCriterionLabel } from '@/lib/analysis-profiles';
import type { ResumeAnalysisResult, SkillEvidence } from '@/types/resume-analysis';
import { ScoreBreakdownDetails, ScoreCard } from './ScoreCard';

export function AnalysisDashboard({
  result,
  section = 'all',
}: {
  result: ResumeAnalysisResult;
  section?: 'all' | 'details' | 'recommendations' | 'vacancies' | 'ats';
}) {
  if (section === 'details')
    return (
      <div className="structured-details">
        <Overview result={result} />
        <TechnicalProfileSection result={result} />
        <SkillsSection result={{ ...result, skillRoi: undefined, skillGaps: undefined }} />
        <LevelSection result={result} />
      </div>
    );
  if (section === 'recommendations')
    return (
      <div className="structured-details">
        <RecommendationsSection result={result} />
        <RisksSection result={result} />
        {result.skillGaps && <SkillGapSection gaps={result.skillGaps.gaps} />}
        {result.skillRoi && <SkillRoiSection skills={result.skillRoi.skills} />}
        <InterviewRisksSection result={result} />
      </div>
    );
  if (section === 'vacancies')
    return (
      <div className="structured-details">
        <MarketFitSection result={result} />
        {isNewVacancyFit(result.vacancyFit) ? (
          <VacancyFitSection fit={result.vacancyFit} />
        ) : (
          !result.marketFit && <Empty />
        )}
      </div>
    );
  if (section === 'ats')
    return result.ats ? (
      <AtsAnalysisSection result={result} />
    ) : (
      <div className="glass-card">
        <ScoreCard title="ATS" score={result.scores.ats} maxScore={100} />
        <ul>
          {result.atsIssues.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      </div>
    );
  return (
    <div className="space-y-8">
      <Overview result={result} />
      {result.marketFit && <MarketFitSection result={result} />}
      {result.technicalProfile && <TechnicalProfileSection result={result} />}
      {(result.skillEvidence || result.skillGaps || result.skillRoi) && <SkillsSection result={result} />}
      {result.ats && <AtsAnalysisSection result={result} />}
      {(result.gradeFit || result.marketPosition) && <LevelSection result={result} />}
      {isNewVacancyFit(result.vacancyFit) && <VacancyFitSection fit={result.vacancyFit} />}
      <RisksSection result={result} />
      {result.interviewRisks?.topics.length ? <InterviewRisksSection result={result} /> : null}
      <RecommendationsSection result={result} />
      {result.markdownReport && <MarkdownReportSection markdown={result.markdownReport} />}
    </div>
  );
}

function SectionHeading({ title, description }: { title: string; description?: string }) {
  return (
    <div>
      <h3 className="text-xl font-semibold">{title}</h3>
      {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
    </div>
  );
}

export function Overview({ result }: { result: ResumeAnalysisResult }) {
  return (
    <section className="space-y-4" aria-labelledby="overview-title">
      <div>
        <h2 id="overview-title" className="text-2xl font-bold">
          {result.targetRole}
        </h2>
        <p className="text-muted-foreground">
          Уровень кандидата: {levelLabels[result.gradeFit?.candidateLevel ?? result.detectedLevel]}
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <ScoreCard title="Общая оценка" score={result.overallScore} maxScore={100} />
        <ScoreCard
          title="Market Fit"
          score={result.marketFit?.score}
          maxScore={100}
          breakdown={result.marketFit?.breakdown}
        />
        <ScoreCard
          title="ATS"
          score={result.ats?.score ?? result.scores.ats}
          maxScore={100}
          breakdown={result.ats?.breakdown}
        />
        <ScoreCard title="Сила кандидата" score={result.candidateStrength} maxScore={100} />
        <ScoreCard
          title="Grade Fit"
          score={result.gradeFit?.score}
          maxScore={100}
          status={result.gradeFit ? gradeFitLabels[result.gradeFit.fit] : undefined}
          breakdown={result.gradeFit?.breakdown}
        />
      </div>
    </section>
  );
}

export function MarketFitSection({ result }: { result: ResumeAnalysisResult }) {
  const fit = result.marketFit;
  if (!fit) return null;
  const components = fit.breakdown?.components ?? [];
  return (
    <section className="space-y-4">
      <SectionHeading title="Соответствие рынку" />
      <Card>
        <CardContent className="space-y-5 pt-6">
          <ScoreRow label="Market Fit" value={fit.score} max={100} />
          <ScoreRow label="Обязательные требования" value={fit.mustHaveCoverage} max={100} />
          <ScoreRow label="Дополнительные требования" value={fit.niceToHaveCoverage} max={100} />
          <ScoreRow label="Подходящие вакансии" value={fit.matchedVacancyPercentage} max={100} />
          {components
            .filter((item) => !['mustHaveCoverage', 'niceToHaveCoverage'].includes(item.name))
            .map((item) => (
              <ScoreRow key={item.name} label={humanizeKey(item.name)} value={item.score} max={100} />
            ))}
          {fit.breakdown && <ScoreBreakdownDetails title="Market Fit" breakdown={fit.breakdown} />}
        </CardContent>
      </Card>
    </section>
  );
}

export function TechnicalProfileSection({ result }: { result: ResumeAnalysisResult }) {
  const profile = result.technicalProfile;
  if (!profile) return null;
  return (
    <section className="space-y-4">
      <SectionHeading title="Технический профиль" />
      <Card>
        <CardContent className="space-y-5 pt-6">
          {profile.assessments.length ? (
            profile.assessments.map((item) => (
              <div key={item.criterionId}>
                <ScoreRow label={getCriterionLabel(item.criterionId)} value={item.score} max={10} />
                {item.evidence.length > 0 && (
                  <p className="mt-1 text-xs text-muted-foreground sm:ml-[calc(33%+0.75rem)]">
                    {item.evidence.join(' · ')}
                  </p>
                )}
              </div>
            ))
          ) : (
            <Empty />
          )}
          {profile.breakdown && <ScoreBreakdownDetails title="Технический профиль" breakdown={profile.breakdown} />}
        </CardContent>
      </Card>
    </section>
  );
}

function SkillsSection({ result }: { result: ResumeAnalysisResult }) {
  return (
    <section className="space-y-6">
      <SectionHeading title="Навыки" />
      {result.skillEvidence && <SkillEvidenceSection skills={result.skillEvidence.skills} />}
      {result.skillGaps && <SkillGapSection gaps={result.skillGaps.gaps} />}
      {result.skillRoi && <SkillRoiSection skills={result.skillRoi.skills} />}
    </section>
  );
}

export function SkillEvidenceSection({ skills }: { skills: SkillEvidence[] }) {
  const order = ['STRONG', 'MEDIUM', 'WEAK', 'MENTION_ONLY', 'NOT_FOUND'] as const;
  return (
    <div className="space-y-3">
      <h4 className="font-semibold">Подтверждение навыков</h4>
      {skills.length ? (
        order.map((status) => {
          const group = skills.filter((skill) => skill.status === status);
          if (!group.length) return null;
          return (
            <Card key={status}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{evidenceStatusLabels[status]}</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-2">
                {group.map((skill) => (
                  <EvidenceItem key={skill.skillId} skill={skill} />
                ))}
              </CardContent>
            </Card>
          );
        })
      ) : (
        <Empty />
      )}
    </div>
  );
}

function EvidenceItem({ skill }: { skill: SkillEvidence }) {
  const confidence = formatConfidence(skill.confidence);
  return (
    <Collapsible className="rounded-md border p-3">
      <CollapsibleTrigger className="flex w-full items-center justify-between gap-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <span>
          <span className="font-medium">{skill.skill}</span>
          <span className="ml-2 text-xs text-muted-foreground">
            {confidence ? `Уверенность ${confidence}` : evidenceStatusLabels[skill.status]}
          </span>
        </span>
        <ChevronDown aria-hidden="true" className="h-4 w-4 shrink-0" />
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-3">
        {skill.evidence.length ? (
          <ul className="list-disc space-y-1 pl-5 text-sm">
            {skill.evidence.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        ) : (
          <Empty />
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}

export function SkillGapSection({ gaps }: { gaps: NonNullable<ResumeAnalysisResult['skillGaps']>['gaps'] }) {
  return (
    <div className="space-y-3">
      <h4 className="font-semibold">Что отсутствует в резюме</h4>
      {gaps.length ? (
        <div className="grid gap-3 md:grid-cols-2">
          {gaps.map((gap) => (
            <Card key={gap.skillId}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-base">{gap.skill}</CardTitle>
                  <StatusBadge label={`${gap.priority} — ${priorityLabels[gap.priority]}`} level={gap.priority} />
                </div>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3 text-sm">
                <Metric label="Встречается в вакансиях" value={formatPercent(gap.marketFrequency)} />
                <Metric label="Ваш уровень" value={evidenceStatusLabels[gap.candidateStatus]} />
                <Metric label="Потенциальный охват" value={formatCoverageGain(gap.estimatedCoverageGain)} />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Empty />
      )}
    </div>
  );
}

export function SkillRoiSection({ skills }: { skills: NonNullable<ResumeAnalysisResult['skillRoi']>['skills'] }) {
  return (
    <div className="space-y-3">
      <SectionHeading
        title="Что выгоднее изучить"
        description="ROI показывает относительную пользу навыка с учётом спроса, текущего пробела и предполагаемой сложности изучения. Это не вероятность трудоустройства."
      />
      {skills.length ? (
        <div className="grid gap-3 md:grid-cols-2">
          {skills.map((skill, index) => (
            <Card key={skill.skillId}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">
                  {index + 1}. {skill.skill}
                </CardTitle>
                <CardDescription>ROI {skill.roiScore}/10</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3 text-sm">
                <Metric label="Спрос" value={formatPercent(skill.marketDemand)} />
                <Metric label="Сложность" value={`${skill.learningEffort} — ${effortLabels[skill.learningEffort]}`} />
                <Metric label="Текущий пробел" value={`${skill.currentGap} — ${priorityLabels[skill.currentGap]}`} />
                <Metric label="Рост охвата" value={formatCoverageGain(skill.estimatedCoverageGain)} />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Empty />
      )}
    </div>
  );
}

export function AtsAnalysisSection({ result }: { result: ResumeAnalysisResult }) {
  const ats = result.ats;
  if (!ats) return null;
  const metrics = [
    ['ATS Score', ats.score],
    ['Parsing', ats.parsing],
    ['Sections', ats.sections],
    ['Contacts', ats.contacts],
    ['Experience', ats.experience],
    ['Education', ats.education],
    ['Skills', ats.skills],
    ['Keyword coverage', ats.keywordCoverage],
  ] as const;
  return (
    <section className="space-y-4">
      <SectionHeading title="ATS-анализ" />
      <Card>
        <CardContent className="space-y-4 pt-6">
          {metrics.map(([label, score]) => (
            <ScoreRow key={label} label={label} value={score} max={100} />
          ))}
          {ats.breakdown && <ScoreBreakdownDetails title="ATS" breakdown={ats.breakdown} />}
        </CardContent>
      </Card>
      {ats.diagnostics.length > 0 && (
        <div className="grid gap-3 md:grid-cols-2">
          {ats.diagnostics.map((diagnostic, index) => (
            <Card key={`${diagnostic.field}-${index}`}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">
                  {diagnosticFieldLabels[diagnostic.field] ?? humanizeKey(diagnostic.field)}
                </CardTitle>
                <CardDescription>
                  {diagnostic.status} — {atsStatusLabels[diagnostic.status]}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {diagnostic.issues.length ? (
                  <ul className="list-disc space-y-1 pl-5 text-sm">
                    {diagnostic.issues.map((issue, issueIndex) => (
                      <li key={issueIndex}>{issue}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">Проблем не обнаружено</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}

function LevelSection({ result }: { result: ResumeAnalysisResult }) {
  const position = result.marketPosition;
  const rows = position
    ? ([
        ['Junior', position.juniorPercentile],
        ['Junior+', position.juniorPlusPercentile],
        ['Middle−', position.middleMinusPercentile],
      ] as const)
    : [];
  return (
    <section className="space-y-4">
      <SectionHeading title="Уровень и позиция" />
      <div className="grid gap-4 md:grid-cols-2">
        {result.gradeFit && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Соответствие уровню</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 text-sm">
              <Metric label="Уровень кандидата" value={levelLabels[result.gradeFit.candidateLevel]} />
              <Metric label="Целевой уровень" value={levelLabels[result.gradeFit.targetLevel]} />
              <Metric label="Результат" value={gradeFitLabels[result.gradeFit.fit]} />
              <Metric label="Score" value={`${result.gradeFit.score}/100`} />
            </CardContent>
          </Card>
        )}
        {position && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Позиция относительно рынка</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {rows.map(([level, percentile]) => (
                <div key={level} className="flex justify-between gap-4 text-sm">
                  <span>{level}</span>
                  <span className="font-medium">
                    {percentile == null ? 'Пока недостаточно данных' : `${percentile} percentile`}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </section>
  );
}

type NewVacancyFit = Extract<NonNullable<ResumeAnalysisResult['vacancyFit']>, { score: number }>;
const isNewVacancyFit = (fit: ResumeAnalysisResult['vacancyFit']): fit is NewVacancyFit =>
  Boolean(fit && 'score' in fit);

function VacancyFitSection({ fit }: { fit: NewVacancyFit }) {
  return (
    <section className="space-y-4">
      <SectionHeading title="Соответствие вакансии" />
      <Card>
        <CardHeader>
          <CardTitle>{fit.score}/100</CardTitle>
          <CardDescription>
            {fit.applyRecommendation} — {vacancyRecommendationLabels[fit.applyRecommendation]}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ScoreRow label="Technical" value={fit.technicalFit} max={100} />
          <ScoreRow label="Experience" value={fit.experienceFit} max={100} />
          <ScoreRow label="Grade" value={fit.gradeFit} max={100} />
          <ScoreRow label="Must-have coverage" value={fit.mustHaveCoverage} max={100} />
          <ScoreRow label="Nice-to-have" value={fit.niceToHaveCoverage} max={100} />
          {fit.breakdown && <ScoreBreakdownDetails title="Vacancy Fit" breakdown={fit.breakdown} />}
        </CardContent>
      </Card>
      {fit.blockers.length > 0 && (
        <Card className="border-destructive/40">
          <CardHeader>
            <CardTitle className="text-lg">Ограничения</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {fit.blockers.map((blocker, index) => (
              <div key={index} className="rounded-md border p-4">
                <StatusBadge
                  label={`${blocker.severity} — ${severityLabels[blocker.severity]}`}
                  level={blocker.severity}
                />
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <Metric label="Требование" value={blocker.required} />
                  <Metric label="У кандидата" value={blocker.actual} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </section>
  );
}

export function RisksSection({ result }: { result: ResumeAnalysisResult }) {
  const hasNewRisks = (result.risks?.length ?? 0) > 0;
  const legacyRisks = [...result.weaknesses, ...result.atsIssues, ...result.warnings];
  if (!hasNewRisks && !legacyRisks.length && !result.claimRisks?.claims.length) return null;
  return (
    <section className="space-y-4">
      <SectionHeading title="Риски" />
      {hasNewRisks ? (
        <div className="grid gap-3 md:grid-cols-2">
          {result.risks.map((risk, index) => (
            <Card key={`${risk.subjectKey}-${index}`}>
              <CardHeader className="pb-3">
                <StatusBadge label={`${risk.severity} — ${severityLabels[risk.severity]}`} level={risk.severity} />
                <CardTitle className="pt-2 text-base">{risk.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <Metric label="Evidence" value={risk.evidence} />
                <Metric label="Impact" value={risk.impact} />
                <Metric label="Action" value={risk.action} />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Риски старого анализа</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc space-y-2 pl-5 text-sm">
              {legacyRisks.map((risk, index) => (
                <li key={index}>{risk}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
      {result.claimRisks?.claims.length ? <ClaimRisksSection result={result} /> : null}
    </section>
  );
}

function ClaimRisksSection({ result }: { result: ResumeAnalysisResult }) {
  return (
    <div className="space-y-3">
      <h4 className="font-semibold">Проверка утверждений резюме</h4>
      <div className="grid gap-3 md:grid-cols-2">
        {result.claimRisks?.claims.map((claim, index) => (
          <Card key={index}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{claim.claim}</CardTitle>
              <CardDescription>
                {claim.recommendation} — {claimRecommendationLabels[claim.recommendation]}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Metric label="Ценность" value={`${claim.valueScore}/10`} />
                <Metric label="Достоверность" value={`${claim.credibilityScore}/10`} />
                <Metric label="Риск вопросов" value={`${claim.interviewRisk}/10`} />
                <Metric label="Качество подтверждения" value={`${claim.evidenceQuality}/10`} />
              </div>
              <Metric label="Рекомендация" value={claim.explanation} />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function InterviewRisksSection({ result }: { result: ResumeAnalysisResult }) {
  return (
    <section className="space-y-4">
      <SectionHeading title="К чему подготовиться на собеседовании" />
      {result.interviewRisks?.topics.map((topic, index) => (
        <Collapsible key={index} className="rounded-lg border bg-card p-4 shadow-sm">
          <CollapsibleTrigger className="flex w-full items-center justify-between gap-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <span>
              <span className="font-semibold">{topic.topic}</span>
              <span className="ml-2 text-xs">
                {topic.risk} — {severityLabels[topic.risk]}
              </span>
            </span>
            <ChevronDown aria-hidden="true" className="h-4 w-4" />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-3 pt-4">
            <Metric label="Источник" value={topic.sourceClaim} />
            {topic.questions.length ? (
              <div>
                <p className="text-xs text-muted-foreground">Возможные вопросы</p>
                <ul className="mt-1 list-disc space-y-1 pl-5 text-sm">
                  {topic.questions.map((question, questionIndex) => (
                    <li key={questionIndex}>{question}</li>
                  ))}
                </ul>
              </div>
            ) : (
              <Empty />
            )}
          </CollapsibleContent>
        </Collapsible>
      ))}
    </section>
  );
}

function RecommendationsSection({ result }: { result: ResumeAnalysisResult }) {
  const structured = result.recommendationAnalysis?.items ?? [];
  if (!structured.length && !result.recommendations.length) return null;
  return (
    <section className="space-y-4">
      <SectionHeading title="Что улучшить" />
      {structured.length ? (
        <div className="grid gap-3 md:grid-cols-2">
          {structured.map((item, index) => (
            <Card key={index}>
              <CardHeader className="pb-3">
                <StatusBadge label={`${item.priority} — ${priorityLabels[item.priority]}`} level={item.priority} />
                <CardTitle className="pt-2 text-base">{item.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <Metric label="Effort" value={`${item.effort} — ${effortLabels[item.effort]}`} />
                <Metric
                  label="Expected impact"
                  value={
                    Object.entries(item.expectedImpact)
                      .map(([key, value]) => `${humanizeKey(key)} ${value > 0 ? '+' : ''}${value}`)
                      .join(' · ') || 'Нет данных'
                  }
                />
                <Metric label="Причина" value={item.reason} />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <ul className="list-disc space-y-2 pl-5 text-sm">
              {result.recommendations.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </section>
  );
}

function MarkdownReportSection({ markdown }: { markdown: string }) {
  return <MarkdownAnalysis content={markdown} />;
}

function ScoreRow({ label, value, max }: { label: string; value: number | null | undefined; max: 10 | 100 }) {
  const normalized = value == null ? undefined : (value / max) * 100;
  return (
    <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(100px,2fr)_70px] sm:items-center sm:gap-3">
      <span className="min-w-0 break-words text-sm">{label}</span>
      {normalized == null ? (
        <span className="text-sm text-muted-foreground">Нет данных</span>
      ) : (
        <Progress aria-label={`${label}: ${value} из ${max}`} value={normalized} />
      )}
      <span className="text-right font-medium">{value == null ? '—' : `${value}/${max}`}</span>
    </div>
  );
}
function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="break-words font-medium">{value}</p>
    </div>
  );
}
function Empty() {
  return <p className="text-sm text-muted-foreground">Недостаточно данных</p>;
}
function StatusBadge({ label, level }: { label: string; level: string }) {
  const variant =
    level === 'CRITICAL' || level === 'HIGH' || level === 'FAILED'
      ? 'destructive'
      : level === 'LOW' || level === 'OK'
        ? 'outline'
        : 'secondary';
  return <Badge variant={variant}>{label}</Badge>;
}
