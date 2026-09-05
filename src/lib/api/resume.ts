import { ApiClientError, createApiUrl, parseApiJson } from './client';
import { resumeAnalysisResultSchema } from '@/types/resume-analysis';
import type { AiProvidersResponse, AnalyzeResumeOptions, ResumeAnalysisResult } from '@/types/resume-analysis';

export async function getAiProviders(signal?: AbortSignal): Promise<AiProvidersResponse> {
  const response = await fetch(createApiUrl('/api/ai/providers'), {
    headers: { Accept: 'application/json' },
    signal,
  });
  return parseApiJson<AiProvidersResponse>(response);
}

export async function analyzeResume(file: File, options: AnalyzeResumeOptions): Promise<ResumeAnalysisResult> {
  const formData = new FormData();
  formData.append('file', file);
  if (options.analysis && options.analysis.mode !== 'AUTO_MARKET') {
    formData.append('analysis', new Blob([JSON.stringify(options.analysis)], { type: 'application/json' }));
  }

  const searchParams = new URLSearchParams({ profile: options.profile });
  if (options.provider) searchParams.set('provider', options.provider);

  const response = await fetch(createApiUrl('/api/resume/analyze', searchParams), {
    method: 'POST',
    headers: { Accept: 'application/json' },
    body: formData,
    signal: options.signal,
  });
  const body = await parseApiJson<unknown>(response);
  const parsed = resumeAnalysisResultSchema.safeParse(body);
  if (!parsed.success) {
    throw new ApiClientError('Backend returned an invalid analysis response', response.status, 'INVALID_RESPONSE');
  }
  return parsed.data;
}
