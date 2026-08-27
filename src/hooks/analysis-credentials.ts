import type { AnalyzeResumeVariables } from "./useResumeAnalysisMutation";

const analysisCredentials = new WeakMap<AnalyzeResumeVariables, string>();

export const setAnalysisCredential = (variables: AnalyzeResumeVariables, apiKey: string): void => {
  analysisCredentials.set(variables, apiKey);
};

export const getAnalysisCredential = (variables: AnalyzeResumeVariables): string => {
  const apiKey = analysisCredentials.get(variables);
  if (!apiKey) throw new Error("API key обязателен");
  return apiKey;
};

export const clearAnalysisCredential = (variables: AnalyzeResumeVariables): void => {
  analysisCredentials.delete(variables);
};
