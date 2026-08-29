import { createApiUrl, parseApiJson } from "./client";
import type { AiProvidersResponse, AnalyzeResumeOptions, ResumeAnalysisResult } from "@/types/resume-analysis";

export async function getAiProviders(signal?: AbortSignal): Promise<AiProvidersResponse> {
  const response = await fetch(createApiUrl("/api/ai/providers"), {
    headers: { Accept: "application/json" },
    signal,
  });
  return parseApiJson<AiProvidersResponse>(response);
}

export async function analyzeResume(
  file: File,
  options: AnalyzeResumeOptions = {},
): Promise<ResumeAnalysisResult> {
  const formData = new FormData();
  formData.append("file", file);
  if (options.provider) formData.append("provider", options.provider);

  const response = await fetch(createApiUrl("/api/resume/analyze"), {
    method: "POST",
    headers: { Accept: "application/json" },
    body: formData,
    signal: options.signal,
  });
  return parseApiJson<ResumeAnalysisResult>(response);
}
