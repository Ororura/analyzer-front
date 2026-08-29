import type { BackendHistoryEntry, HistoryEntry } from "@/types";
import type { ResumeAnalysisResult } from "@/types/resume-analysis";
import { getAiProviderLabel } from "@/lib/ai/providers";

const HISTORY_STORAGE_KEY = "pdf-analyzer-history";

export const isBackendHistoryEntry = (entry: HistoryEntry): entry is BackendHistoryEntry =>
  "version" in entry && entry.version === 2 && typeof entry.result === "object";

export const getHistory = (): HistoryEntry[] => {
  try {
    const stored = localStorage.getItem(HISTORY_STORAGE_KEY);
    const parsed: unknown = stored ? JSON.parse(stored) : [];
    return Array.isArray(parsed) ? parsed as HistoryEntry[] : [];
  } catch {
    return [];
  }
};

export const saveAnalysisToHistory = (fileName: string, result: ResumeAnalysisResult): void => {
  const history = getHistory();
  const entry: BackendHistoryEntry = {
    version: 2,
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
