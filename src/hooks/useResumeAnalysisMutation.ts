import { mutationOptions, useMutation } from '@tanstack/react-query';
import { analyzeResume } from '@/lib/api/resume';
import { getUserFacingErrorMessage } from '@/lib/api/errors';
import { useToast } from '@/hooks/useToast';
import type { AiProviderType, AnalysisProfile, ResumeAnalysisResult } from '@/types/resume-analysis';
import type { VacancyAnalysisContext, VacancyAnalysisRequest } from '@/types/vacancy';

export interface AnalyzeResumeVariables {
  file: File;
  provider: AiProviderType;
  profile: AnalysisProfile;
  analysis?: VacancyAnalysisRequest;
  context?: VacancyAnalysisContext;
  signal?: AbortSignal;
}

export interface CompletedResumeAnalysis {
  file: File;
  provider: AiProviderType;
  profile: AnalysisProfile;
  context?: VacancyAnalysisContext;
  result: ResumeAnalysisResult;
}

export const resumeAnalysisMutationOptions = () =>
  mutationOptions({
    mutationKey: ['resume-analysis'],
    mutationFn: async ({
      file,
      provider,
      profile,
      analysis,
      context,
      signal,
    }: AnalyzeResumeVariables): Promise<CompletedResumeAnalysis> => ({
      file,
      provider,
      profile,
      context,
      result: await analyzeResume(file, { provider, profile, analysis, signal }),
    }),
    retry: false,
  });

export function useResumeAnalysisMutation() {
  const { addToast } = useToast();
  const mutation = useMutation(resumeAnalysisMutationOptions());

  const analyze = async (variables: AnalyzeResumeVariables): Promise<CompletedResumeAnalysis> => {
    try {
      const completedAnalysis = await mutation.mutateAsync(variables);
      addToast({ title: 'Успех', description: 'Резюме успешно проанализировано', variant: 'success' });
      return completedAnalysis;
    } catch (error) {
      addToast({ title: 'Ошибка анализа', description: getUserFacingErrorMessage(error), variant: 'destructive' });
      throw error;
    }
  };

  return { ...mutation, analyze };
}
