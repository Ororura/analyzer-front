export function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const entryDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (entryDate.getTime() === today.getTime()) {
    return `Сегодня в ${date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`;
  }
  if (entryDate.getTime() === yesterday.getTime()) {
    return `Вчера в ${date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`;
  }
  return date.toLocaleDateString('ru-RU') + ` в ${date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`;
};

export interface SkillAssessment {
  name: string;
  score: number;
}

export interface AnalysisResult {
  markdown: string;
  overallScore?: number;
  candidateLevel?: string;
  skills?: SkillAssessment[];
  problems?: string[];
  recommendations?: string[];
  finalVerdict?: {
    hrScreening?: string;
    technicalInterview?: string;
    summary?: string;
  };
}

export const parseMarkdownResponse = (markdown: string): AnalysisResult => {
  const result: AnalysisResult = {
    markdown,
    overallScore: undefined,
    candidateLevel: undefined,
    skills: [],
    problems: [],
    recommendations: [],
    finalVerdict: undefined,
  };

  const lines = markdown.split('\n');
  let currentSection = '';

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed) continue;

    if (trimmed.startsWith('#')) {
      if (trimmed.includes('Текущий уровень')) {
        currentSection = 'candidateLevel';
      } else if (trimmed.includes('Итоговая оценка')) {
        currentSection = 'overallScore';
      } else if (trimmed.includes('Главные проблемы')) {
        currentSection = 'problems';
      } else if (trimmed.includes('Что исправить')) {
        currentSection = 'recommendations';
      } else if (trimmed.includes('Вероятность прохождения')) {
        currentSection = 'verdict';
      }
      continue;
    }

    if (currentSection === 'candidateLevel') {
      result.candidateLevel = trimmed;
    }

    if (currentSection === 'overallScore') {
      const match = trimmed.match(/(\d+)\/10/);
      if (match) {
        result.overallScore = parseInt(match[1], 10);
      }
    }

    if (currentSection === 'problems') {
      const problemMatch = trimmed.match(/^(\d+\.|[•\-\*])\s+(.+)$/);
      if (problemMatch) {
        result.problems?.push(problemMatch[2]);
      }
    }

    if (currentSection === 'recommendations') {
      const recMatch = trimmed.match(/^(\d+\.|[•\-\*])\s+(.+)$/);
      if (recMatch) {
        result.recommendations?.push(recMatch[2]);
      }
    }

    if (currentSection === 'verdict') {
      if (trimmed.includes('HR-скрининга')) {
        const match = trimmed.match(/(Низкая|Средняя|Высокая)/);
        if (match) {
          result.finalVerdict = { ...result.finalVerdict, hrScreening: match[1] };
        }
      }
      if (trimmed.includes('технического интервью')) {
        const match = trimmed.match(/(Низкая|Средняя|Высокая)/);
        if (match) {
          result.finalVerdict = { ...result.finalVerdict, technicalInterview: match[1] };
        }
      }
    }
  }

  return result;
};
