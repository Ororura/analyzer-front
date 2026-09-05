export type ResumeFile = {
  file: File;
  preview: string;
  size: string;
};

import type { ResumeAnalysisResult } from './resume-analysis';

export type LegacyHistoryEntry = {
  id: string;
  fileName: string;
  model: string;
  createdAt: string;
  result: string;
  atsResult?: string;
};

export type BackendHistoryEntry = {
  version: 3;
  id: string;
  fileName: string;
  createdAt: string;
  result: ResumeAnalysisResult;
};

export type HistoryEntry = LegacyHistoryEntry | BackendHistoryEntry;
export type { AiProviderType, AnalysisProfile, ResumeAnalysisResult } from './resume-analysis';
