import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import {
  analyzeResumeWithProfile,
  createAnalysisProfile,
  deleteAnalysisProfile,
  getAnalysisProfile,
  listAnalysisProfiles,
  updateAnalysisProfile,
} from '@/lib/api/analysis-profiles';
import { server } from '../msw/server';
import { resumeAnalysisResult } from '../fixtures/resume-analysis';

const base = 'http://localhost:8080/api/analysis-profiles';
const profile = {
  id: 'b4d56e87-a9c2-4d45-8e18-aec88a762111', version: 3, name: 'Java рост', direction: 'BACKEND',
  specialization: 'Java', targetGrade: 'MIDDLE', technologies: ['Java', 'Spring Boot'], marketFilters: { employment: [], schedule: [] },
  scoringPolicyVersion: '1', createdAt: '2026-09-06T10:00:00Z', updatedAt: '2026-09-06T10:00:00Z',
} as const;

describe('analysis profiles backend client', () => {
  it('lists and loads an individual profile with the backend session', async () => {
    server.use(
      http.get(base, ({ request }) => {
        const url = new URL(request.url);
        expect(url.searchParams.get('page')).toBe('0');
        expect(url.searchParams.get('size')).toBe('50');
        expect(request.credentials).toBe('include');
        return HttpResponse.json([profile]);
      }),
      http.get(`${base}/${profile.id}`, () => HttpResponse.json(profile)),
    );
    await expect(listAnalysisProfiles()).resolves.toHaveLength(1);
    await expect(getAnalysisProfile(profile.id)).resolves.toMatchObject({ version: 3 });
  });

  it('creates a complete editable preset request without saving on apply', async () => {
    server.use(http.post(base, async ({ request }) => {
      expect(await request.json()).toMatchObject({ name: 'Java рост', preset: 'JAVA_BACKEND', direction: 'BACKEND' });
      return HttpResponse.json(profile, { status: 201 });
    }));
    await expect(createAnalysisProfile({ name: 'Java рост', preset: 'JAVA_BACKEND', direction: 'BACKEND' })).resolves.toMatchObject({ id: profile.id });
  });

  it('uses the quoted profile version for update and delete', async () => {
    server.use(
      http.put(`${base}/${profile.id}`, async ({ request }) => {
        expect(request.headers.get('If-Match')).toBe('"3"');
        return HttpResponse.json({ ...profile, version: 4 });
      }),
      http.delete(`${base}/${profile.id}`, ({ request }) => {
        expect(request.headers.get('If-Match')).toBe('"4"');
        return new HttpResponse(null, { status: 204 });
      }),
    );
    await expect(updateAnalysisProfile(profile.id, 3, { name: profile.name })).resolves.toMatchObject({ version: 4 });
    await expect(deleteAnalysisProfile(profile.id, 4)).resolves.toBeUndefined();
  });

  it('sends profileId without conflicting legacy profile or analysis parameters', async () => {
    server.use(http.post('http://localhost:8080/api/resume/analyze', async ({ request }) => {
      const url = new URL(request.url);
      expect(url.searchParams.get('profileId')).toBe(profile.id);
      expect(url.searchParams.get('provider')).toBe('CODEX_CLI');
      expect(url.searchParams.has('profile')).toBe(false);
      const form = await request.formData();
      expect(form.get('analysis')).toBeNull();
      return HttpResponse.json({
        id: '4ae10ce1-d537-43d8-9789-398777448811', profileId: profile.id, profileVersion: 3, status: 'COMPLETED',
        createdAt: '2026-09-06T10:00:00Z', targetGrade: 'MIDDLE', detectedGrade: 'JUNIOR',
        result: { ...resumeAnalysisResult, metadata: { ...resumeAnalysisResult.metadata, analysisProfile: null, marketProfileSource: 'SNAPSHOT' } },
      });
    }));
    const completed = await analyzeResumeWithProfile(new File(['pdf'], 'resume.pdf'), profile.id, 'CODEX_CLI');
    expect(completed.run.targetGrade).toBe('MIDDLE');
    expect(completed.result.overallScore).toBe(resumeAnalysisResult.overallScore);
    expect(completed.result.metadata.analysisProfile).toBeUndefined();
  });

  it.each([400, 404, 409, 412, 422, 500])('preserves profile API status %s', async (status) => {
    server.use(http.get(`${base}/${profile.id}`, () => HttpResponse.json({ error: { code: 'REQUEST_REJECTED', message: 'rejected' } }, { status })));
    await expect(getAnalysisProfile(profile.id)).rejects.toMatchObject({ status, code: 'REQUEST_REJECTED' });
  });
});
