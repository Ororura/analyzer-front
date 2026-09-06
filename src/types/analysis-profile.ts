import type { AiProviderType, ResumeAnalysisResult } from './resume-analysis';

export const CAREER_DIRECTIONS = ['BACKEND', 'FRONTEND', 'MOBILE', 'DEVOPS', 'QA', 'DATA', 'ML'] as const;
export const CANDIDATE_GRADES = ['INTERN', 'JUNIOR', 'JUNIOR_PLUS', 'MIDDLE', 'MIDDLE_PLUS', 'SENIOR'] as const;
export const WORK_FORMATS = ['REMOTE', 'OFFICE', 'HYBRID'] as const;

export type CareerDirection = (typeof CAREER_DIRECTIONS)[number] | (string & {});
export type CandidateGrade = (typeof CANDIDATE_GRADES)[number] | (string & {});
export type WorkFormat = (typeof WORK_FORMATS)[number] | (string & {});

export interface MarketFilters {
  location?: string;
  employer?: string;
  employment: string[];
  schedule: string[];
  workFormat?: WorkFormat;
  salaryFrom?: number;
  salaryTo?: number;
  currency?: string;
  salaryOnly?: boolean;
  publishedFrom?: string;
  searchGrade?: CandidateGrade;
  includeUnknownGrade?: boolean;
}

export interface AnalysisProfileDto {
  id: string;
  version: number;
  name: string;
  direction: CareerDirection;
  specialization: string;
  targetGrade: CandidateGrade;
  technologies: string[];
  marketFilters: MarketFilters;
  preset?: 'JAVA_BACKEND' | 'REACT_FRONTEND' | (string & {});
  scoringPolicyVersion: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProfileRequest {
  name: string;
  preset?: 'JAVA_BACKEND' | 'REACT_FRONTEND';
  direction?: CareerDirection;
  specialization?: string;
  targetGrade?: CandidateGrade;
  technologies?: string[];
  marketFilters?: MarketFilters;
}

export interface AnalysisRun {
  id: string;
  profileId: string;
  profileVersion: number;
  status: 'PREPARING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | (string & {});
  createdAt: string;
  completedAt?: string;
  failureCode?: string;
  targetGrade?: CandidateGrade;
  detectedGrade?: CandidateGrade;
  effectiveConfig?: {
    schemaVersion?: number;
    profile?: AnalysisProfileDto;
    marketSnapshotId?: string;
    analysisProfile?: {
      sufficientSample?: boolean;
      sampleSize?: number;
      generatedAt?: string;
      version?: string;
    };
    market?: {
      source?: string;
      sampleSize?: number;
      marketVersion?: string;
      sufficientSample?: boolean;
      warnings?: string[];
    };
    provider?: AiProviderType;
    model?: string;
    promptVersion?: string;
    evaluationTime?: string;
  };
  result?: ResumeAnalysisResult;
}

