export interface AtsResult {
  overallScore: number;
  breakdown: AtsScoreBreakdown;
  skillsMatch: SkillMatch[];
  keywordsFound: string[];
  keywordsMissing: string[];
  vacancyMatches: VacancyMatch[];
  marketInsights: MarketInsight[];
  recommendations: Recommendation[];
  marketStatistics: MarketStatistics;
}

export interface AtsScoreBreakdown {
  keywordMatch: number;
  technicalMatch: number;
  experienceMatch: number;
  responsibilities: number;
  structure: number;
  semanticMatch: number;
}

export interface SkillMatch {
  skill: string;
  normalizedSkill: string;
  foundInResume: boolean;
  foundInVacancy: boolean;
  importance: 'required' | 'preferred' | 'bonus';
  matchType: 'exact' | 'partial' | 'none';
}

export interface VacancyMatch {
  vacancyId: string;
  vacancyTitle: string;
  company: string;
  score: number;
  scoreBreakdown: AtsScoreBreakdown;
  skillsMatch: SkillMatch[];
  matchLevel: 'perfect' | 'good' | 'partial' | 'low';
}

export interface MarketInsight {
  skill: string;
  normalizedSkill: string;
  frequency: number;
  demand: 'high' | 'medium' | 'low';
  recommendation: string;
}

export interface MarketStatistics {
  totalVacancies: number;
  analyzedAt: string;
  topSkills: MarketInsight[];
  experienceRequirements: Record<string, number>;
  salaryRanges: Record<string, number>;
  employmentTypes: Record<string, number>;
  scheduleTypes: Record<string, number>;
}

export interface Recommendation {
  type: 'skill' | 'experience' | 'keyword' | 'structure' | 'semantic';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  evidence?: string;
  actionable: boolean;
}

export interface ResumeSummary {
  skills: string[];
  experienceYears?: number;
  education?: string[];
  latestPosition?: string;
  latestCompany?: string;
}
