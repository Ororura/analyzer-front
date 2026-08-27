import { useState } from "react";
import type { AtsAnalysisResult } from "@/types/ats";
import { useResumeAnalysisMutation, type AnalyzeResumeInput } from "./useResumeAnalysisMutation";

export interface CurrentFile {
  file: File;
  preview: string;
  size: string;
}

export interface RestoredAnalysis {
  result: string;
  model: string;
  atsResult: AtsAnalysisResult | null;
  file: File;
}

export function useResumeAnalysis() {
  const mutation = useResumeAnalysisMutation();
  const [restoredAnalysis, setRestoredAnalysis] = useState<RestoredAnalysis | null>(null);

  const analyze = async (file: File, apiKey: string, model: string): Promise<void> => {
    setRestoredAnalysis(null);
    mutation.reset();
    await mutation.analyze({ file, apiKey, model } satisfies AnalyzeResumeInput);
  };

  const restore = (analysis: RestoredAnalysis) => {
    mutation.reset();
    setRestoredAnalysis(analysis);
  };

  const completedAnalysis = mutation.data;
  const currentFile = restoredAnalysis
    ? { file: restoredAnalysis.file, preview: "", size: "" }
    : completedAnalysis
      ? { file: completedAnalysis.file, preview: "", size: completedAnalysis.file.size.toString() }
      : null;

  return {
    analyze,
    restore,
    isAnalyzing: mutation.isPending,
    error: mutation.error,
    currentFile,
    analysisResult: restoredAnalysis?.result ??
      (completedAnalysis ? JSON.stringify(completedAnalysis.result.basicAnalysis) : null),
    analysisModel: restoredAnalysis?.model ?? completedAnalysis?.model ?? "",
    atsResult: restoredAnalysis ? restoredAnalysis.atsResult : completedAnalysis?.result.atsAnalysis ?? null,
  };
}
