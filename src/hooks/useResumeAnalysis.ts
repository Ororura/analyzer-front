import { useState } from "react";
import type { ResumeAnalysisResult } from "@/types/resume-analysis";
import type { AiProviderType, AnalysisProfile } from "@/types/resume-analysis";
import type { VacancyAnalysisContext, VacancyAnalysisRequest } from "@/types/vacancy";
import type { RestoredAnalysis } from "./useAnalysisHistory";
import { useResumeAnalysisMutation } from "./useResumeAnalysisMutation";

export function useResumeAnalysis() {
  const mutation = useResumeAnalysisMutation();
  const [restoredAnalysis, setRestoredAnalysis] = useState<RestoredAnalysis | null>(null);

  const analyze = async (
    file: File,
    provider: AiProviderType,
    profile: AnalysisProfile,
    analysis?: VacancyAnalysisRequest,
    context?: VacancyAnalysisContext,
  ): Promise<void> => {
    setRestoredAnalysis(null);
    mutation.reset();
    await mutation.analyze({ file, provider, profile, analysis, context });
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

  const analysisContext = restoredAnalysis ? undefined : completed?.context;

  return { analyze, restore, isAnalyzing: mutation.isPending, error: mutation.error, currentFile, result, legacyMarkdown, analysisContext };
}
