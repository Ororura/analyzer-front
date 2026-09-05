import type { CandidateLevel } from '@/types/resume-analysis';

export const levelLabels: Record<CandidateLevel, string> = {
  intern: 'Стажёр',
  junior: 'Junior',
  junior_plus: 'Junior+',
  middle_minus: 'Middle−',
  middle: 'Middle',
  middle_plus: 'Middle+',
  senior: 'Senior',
};
export const priorityLabels = { CRITICAL: 'Критический', HIGH: 'Высокий', MEDIUM: 'Средний', LOW: 'Низкий' } as const;
export const severityLabels = { CRITICAL: 'Критический', HIGH: 'Высокий', MEDIUM: 'Средний', LOW: 'Низкий' } as const;
export const evidenceStatusLabels = {
  STRONG: 'Сильное подтверждение',
  MEDIUM: 'Среднее подтверждение',
  WEAK: 'Слабое подтверждение',
  MENTION_ONLY: 'Только упоминание',
  NOT_FOUND: 'Не найдено',
} as const;
export const effortLabels = { LOW: 'Низкая', MEDIUM: 'Средняя', HIGH: 'Высокая' } as const;
export const gradeFitLabels = {
  STRONG_MATCH: 'Отличное соответствие',
  MATCH: 'Соответствует',
  SLIGHTLY_UNDERQUALIFIED: 'Немного ниже требований',
  UNDERQUALIFIED: 'Ниже требований',
  SLIGHTLY_OVERQUALIFIED: 'Немного выше требований',
  OVERQUALIFIED: 'Выше требований',
  UNKNOWN: 'Недостаточно данных',
} as const;
export const vacancyRecommendationLabels = {
  STRONG_APPLY: 'Отличное соответствие',
  APPLY: 'Стоит откликнуться',
  APPLY_WITH_RISK: 'Можно откликнуться, есть риски',
  LOW_PRIORITY: 'Низкий приоритет',
  SKIP: 'Лучше пропустить',
} as const;
export const atsStatusLabels = { OK: 'Распознано', PARTIAL: 'Распознано частично', FAILED: 'Не распознано' } as const;
export const claimRecommendationLabels = {
  KEEP: 'Оставить',
  KEEP_AND_PREPARE: 'Оставить и подготовиться',
  CLARIFY: 'Уточнить',
  SOFTEN: 'Смягчить',
  REMOVE: 'Удалить',
} as const;

export const scoreComponentLabels: Record<string, string> = {
  mustHaveCoverage: 'Обязательные требования',
  niceToHaveCoverage: 'Дополнительные требования',
  skillCoverage: 'Навыки',
  experience: 'Опыт',
  experienceFit: 'Опыт',
  gradeFit: 'Соответствие уровню',
  ats: 'ATS',
  atsContribution: 'ATS',
  technicalFit: 'Техническое соответствие',
};
export const diagnosticFieldLabels: Record<string, string> = {
  contacts: 'Контакты',
  experience: 'Опыт работы',
  education: 'Образование',
  skills: 'Навыки',
  parsing: 'Разбор документа',
  sections: 'Секции',
  keywordCoverage: 'Ключевые слова',
};

const localized = (value: number, maximumFractionDigits = 1) =>
  new Intl.NumberFormat('ru-RU', { maximumFractionDigits }).format(value);

export const formatScore = (score: number | null | undefined, maxScore: number): string =>
  score == null ? 'Недостаточно данных' : `${localized(score)}/${localized(maxScore)}`;

export const formatPercent = (value: number | null | undefined): string => {
  if (value == null) return 'Нет данных';
  const percent = Math.abs(value) <= 1 ? value * 100 : value;
  return `${localized(percent)}%`;
};

export const formatConfidence = (value: number | null | undefined): string | null =>
  value == null ? null : formatPercent(value);

export const formatCoverageGain = (value: number | null | undefined): string => {
  if (value == null) return 'Нет данных';
  const formatted = formatPercent(value);
  return `${value > 0 ? '+' : ''}${formatted}`;
};

export const humanizeKey = (value: string): string =>
  scoreComponentLabels[value] ??
  value
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .replace(/^./, (letter: string) => letter.toUpperCase());
