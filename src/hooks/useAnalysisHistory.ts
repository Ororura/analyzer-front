import { useState } from "react";
import { clearHistory, getHistory, isBackendHistoryEntry, saveAnalysisToHistory } from "@/lib/utils/storage";
import type { HistoryEntry } from "@/types";
import type { ResumeAnalysisResult } from "@/types/resume-analysis";

export type RestoredAnalysis =
  | { kind: "backend"; result: ResumeAnalysisResult; file: File }
  | { kind: "legacy"; markdown: string; file: File };

export const restoreHistoryEntry = (entry: HistoryEntry): RestoredAnalysis =>
  isBackendHistoryEntry(entry)
    ? { kind: "backend", result: entry.result, file: new File([], entry.fileName) }
    : { kind: "legacy", markdown: entry.result, file: new File([], entry.fileName) };

export function useAnalysisHistory() {
  const [history, setHistory] = useState<HistoryEntry[]>(getHistory);

  const clear = () => {
    setHistory([]);
    clearHistory();
  };

  const save = (fileName: string, result: ResumeAnalysisResult) => {
    saveAnalysisToHistory(fileName, result);
    setHistory(getHistory());
  };

  return { history, clear, save, restore: restoreHistoryEntry };
}
