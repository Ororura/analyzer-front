import type { BackendHistoryEntry, HistoryEntry, LegacyHistoryEntry } from '@/types';
import { resumeAnalysisResultSchema } from '@/types/resume-analysis';
import type { ResumeAnalysisResult } from '@/types/resume-analysis';
import { getAiProviderLabel } from '@/lib/ai/providers';

const HISTORY_STORAGE_KEY = 'pdf-analyzer-history';
const GENERAL_SCORE_KEYS = new Set(['commercialExperience', 'experienceDescription', 'ats', 'resumeQuality']);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export const isBackendHistoryEntry = (entry: HistoryEntry): entry is BackendHistoryEntry =>
  'version' in entry && entry.version === 3;

const parseLegacyMarkdownEntry = (value: unknown): LegacyHistoryEntry | null => {
  if (
    !isRecord(value) ||
    typeof value.id !== 'string' ||
    typeof value.fileName !== 'string' ||
    typeof value.createdAt !== 'string' ||
    typeof value.model !== 'string' ||
    typeof value.result !== 'string'
  )
    return null;
  return {
    id: value.id,
    fileName: value.fileName,
    createdAt: value.createdAt,
    model: value.model,
    result: value.result,
    atsResult: typeof value.atsResult === 'string' ? value.atsResult : undefined,
  };
};

const migrateV2Result = (value: unknown): ResumeAnalysisResult | null => {
  if (!isRecord(value) || !isRecord(value.scores) || !isRecord(value.metadata)) return null;
  const assessments = Object.entries(value.scores)
    .filter(([key, score]) => !GENERAL_SCORE_KEYS.has(key) && typeof score === 'number' && Number.isInteger(score))
    .map(([criterionId, score]) => ({ criterionId, score: score as number, evidence: [] }));
  const candidate = {
    ...value,
    scores: {
      assessments,
      commercialExperience: value.scores.commercialExperience,
      experienceDescription: value.scores.experienceDescription,
      ats: value.scores.ats,
      resumeQuality: value.scores.resumeQuality,
    },
    metadata: { ...value.metadata, analysisProfile: 'JAVA_BACKEND' },
  };
  const parsed = resumeAnalysisResultSchema.safeParse(candidate);
  return parsed.success ? parsed.data : null;
};

const parseHistoryEntry = (value: unknown): HistoryEntry | null => {
  if (!isRecord(value)) return null;
  if (
    value.version === 3 &&
    typeof value.id === 'string' &&
    typeof value.fileName === 'string' &&
    typeof value.createdAt === 'string'
  ) {
    const result = resumeAnalysisResultSchema.safeParse(value.result);
    return result.success
      ? {
          version: 3,
          id: value.id,
          fileName: value.fileName,
          createdAt: value.createdAt,
          result: result.data,
        }
      : null;
  }
  if (
    value.version === 2 &&
    typeof value.id === 'string' &&
    typeof value.fileName === 'string' &&
    typeof value.createdAt === 'string'
  ) {
    const result = migrateV2Result(value.result);
    return result
      ? {
          version: 3,
          id: value.id,
          fileName: value.fileName,
          createdAt: value.createdAt,
          result,
        }
      : null;
  }
  return parseLegacyMarkdownEntry(value);
};

export const getHistory = (): HistoryEntry[] => {
  try {
    const stored = localStorage.getItem(HISTORY_STORAGE_KEY);
    const parsed: unknown = stored ? JSON.parse(stored) : [];
    return Array.isArray(parsed)
      ? parsed.map(parseHistoryEntry).filter((entry): entry is HistoryEntry => entry !== null)
      : [];
  } catch {
    return [];
  }
};

export const saveAnalysisToHistory = (fileName: string, result: ResumeAnalysisResult): void => {
  const history = getHistory();
  const entry: BackendHistoryEntry = {
    version: 3,
    id: Date.now().toString(),
    fileName,
    createdAt: new Date().toISOString(),
    result,
  };
  const remaining = history.filter((item) => item.fileName !== fileName);
  localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify([entry, ...remaining].slice(0, 20)));
};

export const clearHistory = (): void => localStorage.removeItem(HISTORY_STORAGE_KEY);

export const getHistoryProviderLabel = (entry: HistoryEntry): string => {
  if (!isBackendHistoryEntry(entry)) return entry.model;
  const provider = getAiProviderLabel(entry.result.metadata.provider);
  return entry.result.metadata.model ? `${provider} · ${entry.result.metadata.model}` : provider;
};
