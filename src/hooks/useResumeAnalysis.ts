import { useState } from "react";
import type { ResumeAnalysisResult } from "@/types/resume-analysis";
import type { AiProviderType } from "@/types/resume-analysis";
import type { RestoredAnalysis } from "./useAnalysisHistory";
import { useResumeAnalysisMutation } from "./useResumeAnalysisMutation";

export function useResumeAnalysis() {
  const mutation = useResumeAnalysisMutation();
  const [restoredAnalysis, setRestoredAnalysis] = useState<RestoredAnalysis | null>(null);

  const analyze = async (file: File, provider: AiProviderType): Promise<void> => {
    setRestoredAnalysis(null);
    mutation.reset();
    await mutation.analyze({ file, provider });
  };

  const restore = (analysis: RestoredAnalysis) => {
    mutation.reset();
    setRestoredAnalysis(analysis);
  };

  const completed = mutation.data;
  const currentFile = restoredAnalysis?.file ?? completed?.file ?? null;
  const result: ResumeAnalysisResult | null =
    restoredAnalysis?.kind === "backend" ? restoredAnalysis.result : completed?.result ?? null;
  const legacyMarkdown = restoredAnalysis?.kind === "legacy" ? restoredAnalysis.markdown : null;

  return { analyze, restore, isAnalyzing: mutation.isPending, error: mutation.error, currentFile, result, legacyMarkdown };
}
