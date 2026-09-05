import { QueryClient } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { resumeAnalysisResult } from '../fixtures/resume-analysis';

const { analyzeResumeMock } = vi.hoisted(() => ({ analyzeResumeMock: vi.fn() }));
vi.mock('@/lib/api/resume', () => ({ analyzeResume: analyzeResumeMock }));

import { resumeAnalysisMutationOptions } from '@/hooks/useResumeAnalysisMutation';

describe('resume analysis mutation', () => {
  const clients: QueryClient[] = [];
  afterEach(() => {
    clients.splice(0).forEach((client) => client.clear());
    vi.clearAllMocks();
  });

  const createMutation = () => {
    const client = new QueryClient();
    clients.push(client);
    return client.getMutationCache().build(client, resumeAnalysisMutationOptions());
  };

  it('keeps pending state until the backend analysis completes', async () => {
    let resolveAnalysis: (value: typeof resumeAnalysisResult) => void = () => undefined;
    analyzeResumeMock.mockReturnValue(
      new Promise((resolve) => {
        resolveAnalysis = resolve;
      }),
    );
    const mutation = createMutation();
    const execution = mutation.execute({
      file: new File(['pdf'], 'resume.pdf'),
      provider: 'CODEX_CLI',
      profile: 'JAVA_BACKEND',
    });
    await vi.waitFor(() => expect(mutation.state.status).toBe('pending'));
    resolveAnalysis(resumeAnalysisResult);
    await execution;
    expect(mutation.state.status).toBe('success');
  });

  it('passes the selected provider and preserves backend values', async () => {
    analyzeResumeMock.mockResolvedValue(resumeAnalysisResult);
    const file = new File(['pdf'], 'resume.pdf');
    const result = await createMutation().execute({ file, provider: 'CODEX_CLI', profile: 'REACT_FRONTEND' });
    expect(analyzeResumeMock).toHaveBeenCalledWith(file, {
      provider: 'CODEX_CLI',
      profile: 'REACT_FRONTEND',
      analysis: undefined,
      signal: undefined,
    });
    expect(result.result).toBe(resumeAnalysisResult);
    expect(result.result).toMatchObject({
      overallScore: 67,
      detectedLevel: 'middle_minus',
      experience: { commercialMonths: 29 },
    });
  });

  it('passes vacancy analysis and keeps its display context', async () => {
    analyzeResumeMock.mockResolvedValue(resumeAnalysisResult);
    const analysis = { mode: 'SINGLE_VACANCY' as const, vacancyId: 'hh-123' };
    const context = { mode: 'SINGLE_VACANCY' as const, vacancyTitle: 'Java Developer', vacancyCompany: 'Acme' };
    const result = await createMutation().execute({
      file: new File(['pdf'], 'resume.pdf'),
      provider: 'CODEX_CLI',
      profile: 'JAVA_BACKEND',
      analysis,
      context,
    });
    expect(analyzeResumeMock).toHaveBeenCalledWith(expect.any(File), {
      provider: 'CODEX_CLI',
      profile: 'JAVA_BACKEND',
      analysis,
      signal: undefined,
    });
    expect(result.context).toEqual(context);
  });

  it('does not retry or fall back after a provider error', async () => {
    const error = new Error('provider failed');
    analyzeResumeMock.mockRejectedValue(error);
    await expect(
      createMutation().execute({
        file: new File(['pdf'], 'resume.pdf'),
        provider: 'CODEX_CLI',
        profile: 'JAVA_BACKEND',
      }),
    ).rejects.toBe(error);
    expect(analyzeResumeMock).toHaveBeenCalledTimes(1);
  });
});
