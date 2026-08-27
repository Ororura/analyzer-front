import { mutationOptions, useMutation, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { analyzeResume } from "@/lib/analysis/analyze-resume";
import type { ResumeAnalysisResult } from "@/lib/analysis/schema";
import type { VacancyMarketData } from "@/lib/ats/market-data";
import { useToast } from "@/hooks/useToast";
import { clearAnalysisCredential, getAnalysisCredential, setAnalysisCredential } from "./analysis-credentials";
import { vacancyMarketQueryOptions } from "./useVacancyMarketQuery";

export interface AnalyzeResumeVariables {
  file: File;
  model: string;
}

export interface AnalyzeResumeInput extends AnalyzeResumeVariables {
  apiKey: string;
}

export interface CompletedResumeAnalysis extends AnalyzeResumeVariables {
  result: ResumeAnalysisResult;
  market: VacancyMarketData;
}

export const resumeAnalysisMutationOptions = (
  queryClient: QueryClient,
  getApiKey: (variables: AnalyzeResumeVariables) => string = getAnalysisCredential,
) =>
  mutationOptions({
    mutationKey: ["resume-analysis"],
    mutationFn: async (variables: AnalyzeResumeVariables): Promise<CompletedResumeAnalysis> => {
      const { file, model } = variables;
      const market = await queryClient.fetchQuery(vacancyMarketQueryOptions());
      const result = await analyzeResume(file, getApiKey(variables), model, market);

      return { file, model, result, market };
    },
    retry: false,
  });

export function useResumeAnalysisMutation() {
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const mutation = useMutation(resumeAnalysisMutationOptions(queryClient));

  const analyze = async ({ apiKey, ...variables }: AnalyzeResumeInput): Promise<CompletedResumeAnalysis> => {
    setAnalysisCredential(variables, apiKey);

    try {
      const completedAnalysis = await mutation.mutateAsync(variables);
      if (completedAnalysis.market.source === "baseline" || completedAnalysis.market.warnings.length > 0) {
        addToast({
          title: "ATS-анализ выполнен с ограничениями",
          description:
            completedAnalysis.market.warnings.join("; ") || "Использован встроенный рыночный baseline",
        });
      }
      addToast({
        title: "Успех",
        description: "Резюме успешно проанализировано",
        variant: "success",
      });
      return completedAnalysis;
    } catch (error) {
      addToast({
        title: "Ошибка",
        description: `Не удалось выполнить анализ: ${error instanceof Error ? error.message : "Неизвестная ошибка"}`,
        variant: "destructive",
      });
      throw error;
    } finally {
      clearAnalysisCredential(variables);
    }
  };

  return { ...mutation, analyze };
}
