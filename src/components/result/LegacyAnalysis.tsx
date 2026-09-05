import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { levelLabels } from '@/lib/analysis-presentation';
import { getAiProviderLabel } from '@/lib/ai/providers';
import { getCriterionLabel } from '@/lib/analysis-profiles';
import type { ResumeAnalysisResult } from '@/types/resume-analysis';
export function LegacyAnalysis({
  result,
  section = 'details',
}: {
  result: ResumeAnalysisResult;
  section?: 'details' | 'recommendations' | 'vacancies' | 'ats';
}) {
  if (section === 'recommendations')
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <LegacyList title="Рекомендации" items={result.recommendations} />
        <LegacyList title="Риски" items={[...result.weaknesses, ...result.warnings]} />
      </div>
    );
  if (section === 'ats')
    return (
      <div className="glass-card space-y-4">
        <Metric label="ATS readability" value={`${result.scores.ats}/100`} />
        <Progress aria-label={`ATS: ${result.scores.ats} из 100`} value={result.scores.ats} />
        <LegacyList title="ATS-проблемы" items={result.atsIssues} />
      </div>
    );
  if (section === 'vacancies')
    return result.vacancyFit && 'candidateLevelFit' in result.vacancyFit ? (
      <LegacyVacancyFit fit={result.vacancyFit} />
    ) : (
      <div className="glass-card">
        <p>Нет отдельной оценки вакансии. Выберите вакансию при следующем анализе.</p>
      </div>
    );

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{result.targetRole}</CardTitle>
          <p className="text-sm text-muted-foreground">
            AI provider: {getAiProviderLabel(result.metadata.provider)}
            {result.metadata.model ? ` · Модель: ${result.metadata.model}` : ''}
          </p>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Metric label="Уровень" value={levelLabels[result.detectedLevel]} />
          <Metric label="Общая оценка" value={`${result.overallScore}/100`} />
          <Metric label="Сила кандидата" value={`${result.candidateStrength}/100`} />
          <Metric
            label="Опыт"
            value={`${result.experience.commercialYears} г. ${result.experience.remainingMonths} мес.`}
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Техническое соответствие</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {result.scores.assessments.map((item) => (
            <div key={item.criterionId} className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{getCriterionLabel(item.criterionId)}</span>
                <span>{item.score}/10</span>
              </div>
              <Progress aria-label={`${item.criterionId}: ${item.score} из 10`} value={item.score * 10} />
              {item.evidence.length ? (
                <ul className="list-disc pl-5 text-sm text-muted-foreground">
                  {item.evidence.map((evidence, index) => (
                    <li key={index}>{evidence}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">Недостаточно подтверждённых данных</p>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">ATS readability</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>ATS</span>
            <span>{result.scores.ats}/100</span>
          </div>
          <Progress aria-label={`ATS: ${result.scores.ats} из 100`} value={result.scores.ats} />
        </CardContent>
      </Card>
      <div className="grid gap-4 md:grid-cols-2">
        <LegacyList title="Сильные стороны" items={result.strengths} />
        <LegacyList title="Риски" items={[...result.weaknesses, ...result.atsIssues, ...result.warnings]} />
        <LegacyList title="Рекомендации" items={result.recommendations} />
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Навыки</CardTitle>
            <p className="text-sm text-muted-foreground">Часто встречается в вакансиях, но не найдено в резюме</p>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {[...result.skills.confirmed, ...result.skills.weakEvidence, ...result.skills.missing].map((skill) => (
              <Badge key={skill} variant="secondary">
                {skill}
              </Badge>
            ))}
          </CardContent>
        </Card>
      </div>
      {result.vacancyFit && 'candidateLevelFit' in result.vacancyFit && <LegacyVacancyFit fit={result.vacancyFit} />}
    </div>
  );
}
function LegacyList({ title, items }: { title: string; items: string[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length ? (
          <ul className="list-disc space-y-1 pl-5 text-sm">
            {items.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">Нет</p>
        )}
      </CardContent>
    </Card>
  );
}
function LegacyVacancyFit({
  fit,
}: {
  fit: Extract<NonNullable<ResumeAnalysisResult['vacancyFit']>, { candidateLevelFit: string }>;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Соответствие вакансии</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Metric label="Релевантность опыта" value={`${fit.experienceRelevanceScore}/10`} />
        {fit.requiredSkills.length > 0 && <LegacyList title="Обязательные навыки" items={fit.requiredSkills} />}
        {fit.optionalSkills.length > 0 && <LegacyList title="Дополнительные навыки" items={fit.optionalSkills} />}
        {fit.probableRejectionReasons.length > 0 && (
          <LegacyList title="Возможные причины отказа" items={fit.probableRejectionReasons} />
        )}
      </CardContent>
    </Card>
  );
}
function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-semibold">{value}</p>
    </div>
  );
}
