import { ApiClientError, createApiUrl, parseApiJson } from './client';
import { resumeAnalysisResultSchema } from '@/types/resume-analysis';
import type { AnalysisProfileDto, AnalysisRun, ProfileRequest } from '@/types/analysis-profile';
import type { AiProviderType, ResumeAnalysisResult } from '@/types/resume-analysis';

const jsonHeaders = { Accept: 'application/json', 'Content-Type': 'application/json' };

export async function listAnalysisProfiles(signal?: AbortSignal): Promise<AnalysisProfileDto[]> {
  const profiles: AnalysisProfileDto[] = [];
  for (let page = 0; page < 100; page += 1) {
    const params = new URLSearchParams({ page: String(page), size: '50' });
    const response = await fetch(createApiUrl('/api/analysis-profiles', params), {
      headers: { Accept: 'application/json' },
      credentials: 'include',
      signal,
    });
    const items = await parseApiJson<AnalysisProfileDto[]>(response);
    profiles.push(...items);
    if (items.length < 50) break;
  }
  return profiles;
}

export async function getAnalysisProfile(id: string, signal?: AbortSignal): Promise<AnalysisProfileDto> {
  const response = await fetch(createApiUrl(`/api/analysis-profiles/${encodeURIComponent(id)}`), {
    headers: { Accept: 'application/json' },
    credentials: 'include',
    signal,
  });
  return parseApiJson<AnalysisProfileDto>(response);
}

export async function createAnalysisProfile(request: ProfileRequest): Promise<AnalysisProfileDto> {
  const response = await fetch(createApiUrl('/api/analysis-profiles'), {
    method: 'POST',
    headers: jsonHeaders,
    credentials: 'include',
    body: JSON.stringify(request),
  });
  return parseApiJson<AnalysisProfileDto>(response);
}

export async function updateAnalysisProfile(
  id: string,
  version: number,
  request: ProfileRequest,
): Promise<AnalysisProfileDto> {
  const response = await fetch(createApiUrl(`/api/analysis-profiles/${encodeURIComponent(id)}`), {
    method: 'PUT',
    headers: { ...jsonHeaders, 'If-Match': `"${version}"` },
    credentials: 'include',
    body: JSON.stringify(request),
  });
  return parseApiJson<AnalysisProfileDto>(response);
}

export async function deleteAnalysisProfile(id: string, version: number): Promise<void> {
  const response = await fetch(createApiUrl(`/api/analysis-profiles/${encodeURIComponent(id)}`), {
    method: 'DELETE',
    headers: { Accept: 'application/json', 'If-Match': `"${version}"` },
    credentials: 'include',
  });
  if (!response.ok) await parseApiJson(response);
}

const wait = (milliseconds: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const timer = window.setTimeout(resolve, milliseconds);
    signal?.addEventListener(
      'abort',
      () => {
        window.clearTimeout(timer);
        reject(new DOMException('Aborted', 'AbortError'));
      },
      { once: true },
    );
  });

export async function getAnalysisRun(id: string, signal?: AbortSignal): Promise<AnalysisRun> {
  const response = await fetch(createApiUrl(`/api/analysis-runs/${encodeURIComponent(id)}`), {
    headers: { Accept: 'application/json' },
    credentials: 'include',
    signal,
  });
  return parseApiJson<AnalysisRun>(response);
}

export async function analyzeResumeWithProfile(
  file: File,
  profileId: string,
  provider?: AiProviderType,
  signal?: AbortSignal,
): Promise<{ run: AnalysisRun; result: ResumeAnalysisResult }> {
  const formData = new FormData();
  formData.append('file', file);
  const params = new URLSearchParams({ profileId });
  if (provider) params.set('provider', provider);
  const response = await fetch(createApiUrl('/api/resume/analyze', params), {
    method: 'POST',
    headers: { Accept: 'application/json' },
    credentials: 'include',
    body: formData,
    signal,
  });
  let run = await parseApiJson<AnalysisRun>(response);
  for (let attempt = 0; (run.status === 'PREPARING' || run.status === 'RUNNING') && attempt < 90; attempt += 1) {
    await wait(2000, signal);
    run = await getAnalysisRun(run.id, signal);
  }
  if (run.status === 'FAILED') {
    throw new ApiClientError('Profile analysis failed', 500, run.failureCode || 'ANALYSIS_FAILED');
  }
  if (run.status !== 'COMPLETED' || !run.result) {
    throw new ApiClientError('Profile analysis timed out', 504, 'AI_TIMEOUT');
  }
  const parsed = resumeAnalysisResultSchema.safeParse(run.result);
  if (!parsed.success) throw new ApiClientError('Backend returned an invalid analysis response', 200, 'INVALID_RESPONSE');
  return { run: { ...run, result: parsed.data }, result: parsed.data };
}
