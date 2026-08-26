import { useState } from "react";
import { AtsAnalysisResultSchema } from "@/lib/analysis/schema";
import type { HistoryEntry } from "@/types";
import type { AtsAnalysisResult } from "@/types/ats";

const HISTORY_STORAGE_KEY = "pdf-analyzer-history";

export interface RestoredHistoryEntry {
  result: string;
  model: string;
  atsResult: AtsAnalysisResult | null;
  file: File;
}

function loadHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY);

    if (!raw) {
      return [];
    }

    const parsed: unknown = JSON.parse(raw);

    return Array.isArray(parsed) ? (parsed as HistoryEntry[]) : [];
  } catch {
    return [];
  }
}

function parseAtsResult(value: HistoryEntry["atsResult"]): AtsAnalysisResult | null {
  if (!value) {
    return null;
  }

  try {
    const json: unknown = typeof value === "string" ? JSON.parse(value) : value;

    const parsed = AtsAnalysisResultSchema.safeParse(json);

    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export function useAnalysisHistory() {
  const [history, setHistory] = useState<HistoryEntry[]>(loadHistory);

  const clear = () => {
    setHistory([]);
    localStorage.removeItem(HISTORY_STORAGE_KEY);
  };

  const restore = (entry: HistoryEntry): RestoredHistoryEntry => ({
    result: entry.result,
    model: entry.model,
    atsResult: parseAtsResult(entry.atsResult),
    file: new File([], entry.fileName),
  });

  return {
    history,
    clear,
    restore,
  };
}
