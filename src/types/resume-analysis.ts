import { z } from "zod/v4-mini";

export const analysisProfileSchema = z.enum(["JAVA_BACKEND", "REACT_FRONTEND"]);
export type AnalysisProfile = z.infer<typeof analysisProfileSchema>;

export const aiProviderSchema = z.enum(["POLZA", "CODEX_CLI"]);
export type AiProviderType = z.infer<typeof aiProviderSchema>;

export const candidateLevelSchema = z.enum(["junior", "junior_plus", "middle_minus", "middle"]);
export type CandidateLevel = z.infer<typeof candidateLevelSchema>;

export const interviewChanceSchema = z.enum(["LOW", "MEDIUM", "HIGH"]);
export type InterviewChance = z.infer<typeof interviewChanceSchema>;

const nonEmptyStringSchema = z.string().check(z.minLength(1));
const stringArraySchema = z._default(z.array(z.string()), []);

export const criterionAssessmentSchema = z.object({
  criterionId: nonEmptyStringSchema,
  score: z.int(),
  evidence: stringArraySchema,
});
export type CriterionAssessment = z.infer<typeof criterionAssessmentSchema>;

const vacancyFitSchema = z.object({
  requiredSkills: stringArraySchema,
  optionalSkills: stringArraySchema,
  missingSkills: stringArraySchema,
  experienceRelevanceScore: z.int(),
  candidateLevelFit: z.string(),
  risks: stringArraySchema,
  probableRejectionReasons: stringArraySchema,
});

const rawResumeAnalysisResultSchema = z.object({
  targetRole: z.string(),
  detectedLevel: candidateLevelSchema,
  scores: z.object({
    assessments: z._default(z.array(criterionAssessmentSchema), []),
    commercialExperience: z.int(),
    experienceDescription: z.int(),
    ats: z.int(),
    resumeQuality: z.int(),
  }),
  overallScore: z.int(),
  candidateStrength: z.int(),
  hrScreeningChance: interviewChanceSchema,
  technicalInterviewChance: interviewChanceSchema,
  experience: z.object({
    commercialMonths: z.int(),
    commercialYears: z.int(),
    remainingMonths: z.int(),
  }),
  skills: z.object({
    confirmed: stringArraySchema,
    weakEvidence: stringArraySchema,
    missing: stringArraySchema,
  }),
  strengths: stringArraySchema,
  weaknesses: stringArraySchema,
  atsIssues: stringArraySchema,
  recommendations: stringArraySchema,
  vacancyFit: z.nullish(vacancyFitSchema),
  market: z.object({
    source: z.string(),
    sampleSize: z.int(),
  }),
  metadata: z.object({
    analysisProfile: nonEmptyStringSchema,
    analysisVersion: z.string(),
    baselineVersion: z.string(),
    marketProfileVersion: z.nullish(z.string()),
    marketProfileSource: z.nullish(z.enum(["LIVE", "CACHED", "FALLBACK"])),
    generatedAt: z.string(),
    provider: aiProviderSchema,
    model: z.nullish(z.string()),
  }),
  warnings: stringArraySchema,
});

export const resumeAnalysisResultSchema = z.pipe(
  rawResumeAnalysisResultSchema,
  z.transform((value) => ({
    ...value,
    vacancyFit: value.vacancyFit ?? undefined,
    metadata: {
      ...value.metadata,
      marketProfileVersion: value.metadata.marketProfileVersion ?? undefined,
      marketProfileSource: value.metadata.marketProfileSource ?? undefined,
      model: value.metadata.model ?? undefined,
    },
  })),
);

export type ResumeAnalysisResult = z.infer<typeof resumeAnalysisResultSchema>;

export interface AiProvidersResponse {
  defaultProvider: AiProviderType;
  providers: Array<{
    id: AiProviderType;
    available: boolean;
  }>;
}

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
  };
}

export interface AnalyzeResumeOptions {
  provider?: AiProviderType;
  profile: AnalysisProfile;
  analysis?: import("./vacancy").VacancyAnalysisRequest;
  signal?: AbortSignal;
}
