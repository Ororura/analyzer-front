import type { AnalysisProfile } from '@/types/resume-analysis';

interface AnalysisProfileConfig {
  label: string;
  vacancyQuery: string;
  suggestedTechnologies: readonly string[];
}

export const ANALYSIS_PROFILES: readonly AnalysisProfile[] = ['JAVA_BACKEND', 'REACT_FRONTEND'];

export const ANALYSIS_PROFILE_CONFIG: Record<AnalysisProfile, AnalysisProfileConfig> = {
  JAVA_BACKEND: {
    label: 'Java Backend Developer',
    vacancyQuery: 'Java Backend Developer',
    suggestedTechnologies: ['Java', 'Spring Boot', 'PostgreSQL', 'Docker', 'Kafka', 'REST API'],
  },
  REACT_FRONTEND: {
    label: 'React Frontend Developer',
    vacancyQuery: 'React Frontend Developer',
    suggestedTechnologies: ['JavaScript', 'TypeScript', 'React', 'Next.js', 'Testing Library', 'REST API'],
  },
};

const ACRONYMS: Record<string, string> = {
  api: 'API',
  ats: 'ATS',
  css: 'CSS',
  html: 'HTML',
  javascript: 'JavaScript',
  jpa: 'JPA',
  sql: 'SQL',
  typescript: 'TypeScript',
  ui: 'UI',
  ux: 'UX',
};

export const formatIdentifierLabel = (value: string): string => {
  const words = value
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  return words
    .map((word) => {
      const normalized = word.toLocaleLowerCase();
      return ACRONYMS[normalized] ?? `${normalized.charAt(0).toLocaleUpperCase()}${normalized.slice(1)}`;
    })
    .join(' ');
};

export const getAnalysisProfileLabel = (profile: string): string =>
  ANALYSIS_PROFILE_CONFIG[profile as AnalysisProfile]?.label ?? formatIdentifierLabel(profile);

export const getCriterionLabel = (criterionId: string): string => formatIdentifierLabel(criterionId);
