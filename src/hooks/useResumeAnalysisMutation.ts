import { mutationOptions, useMutation } from "@tanstack/react-query";
import { analyzeResume } from "@/lib/api/resume";
import { getUserFacingErrorMessage } from "@/lib/api/errors";
import { useToast } from "@/hooks/useToast";
import type { AiProviderType, ResumeAnalysisResult } from "@/types/resume-analysis";

export interface AnalyzeResumeVariables {
  file: File;
  provider: AiProviderType;
  signal?: AbortSignal;
}

export interface CompletedResumeAnalysis {
  file: File;
  provider: AiProviderType;
  result: ResumeAnalysisResult;
}

export const resumeAnalysisMutationOptions = () =>
  mutationOptions({
    mutationKey: ["resume-analysis"],
    mutationFn: async ({ file, provider, signal }: AnalyzeResumeVariables): Promise<CompletedResumeAnalysis> => ({
      file,
      provider,
      result: await analyzeResume(file, { provider, signal }),
    }),
    retry: false,
  });

export function useResumeAnalysisMutation() {
  const { addToast } = useToast();
  const mutation = useMutation(resumeAnalysisMutationOptions());

  const analyze = async (variables: AnalyzeResumeVariables): Promise<CompletedResumeAnalysis> => {
    try {
      const completedAnalysis = await mutation.mutateAsync(variables);
      addToast({ title: "Успех", description: "Резюме успешно проанализировано", variant: "success" });
      return completedAnalysis;
    } catch (error) {
      addToast({ title: "Ошибка анализа", description: getUserFacingErrorMessage(error), variant: "destructive" });
      throw error;
    }
  };

  return { ...mutation, analyze };
}
