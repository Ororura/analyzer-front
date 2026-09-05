import { z } from 'zod/v4-mini';

export const analysisProfileSchema = z.enum(['JAVA_BACKEND', 'REACT_FRONTEND']);
export type AnalysisProfile = z.infer<typeof analysisProfileSchema>;
export const aiProviderSchema = z.enum(['POLZA', 'CODEX_CLI']);
export type AiProviderType = z.infer<typeof aiProviderSchema>;
export const candidateLevelSchema = z.enum([
  'intern',
  'junior',
  'junior_plus',
  'middle_minus',
  'middle',
  'middle_plus',
  'senior',
]);
export type CandidateLevel = z.infer<typeof candidateLevelSchema>;
export const interviewChanceSchema = z.enum(['LOW', 'MEDIUM', 'HIGH']);
export type InterviewChance = z.infer<typeof interviewChanceSchema>;
export const prioritySchema = z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']);
export const riskSeveritySchema = z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']);
export const evidenceStatusSchema = z.enum(['STRONG', 'MEDIUM', 'WEAK', 'MENTION_ONLY', 'NOT_FOUND']);
export const effortSchema = z.enum(['LOW', 'MEDIUM', 'HIGH']);

const stringArraySchema = z._default(z.array(z.string()), []);
const nullable = <T extends z.core.SomeType>(schema: T) => z.nullish(schema);

export const criterionAssessmentSchema = z.object({
  criterionId: z.string(),
  score: z.int(),
  evidence: stringArraySchema,
});
export type CriterionAssessment = z.infer<typeof criterionAssessmentSchema>;
export const scoreComponentSchema = z.object({
  name: z.string(),
  score: z.int(),
  weight: z.number(),
  contribution: z.number(),
  explanation: nullable(z.string()),
});
export const scoreBreakdownSchema = z.object({
  score: z.int(),
  components: z._default(z.array(scoreComponentSchema), []),
});
export type ScoreBreakdown = z.infer<typeof scoreBreakdownSchema>;

const marketFitSchema = z.object({
  score: z.int(),
  mustHaveCoverage: z.int(),
  niceToHaveCoverage: z.int(),
  matchedVacancyPercentage: nullable(z.int()),
  targetLevel: candidateLevelSchema,
  breakdown: nullable(scoreBreakdownSchema),
});
const marketPositionSchema = z.object({
  juniorPercentile: nullable(z.int()),
  juniorPlusPercentile: nullable(z.int()),
  middleMinusPercentile: nullable(z.int()),
});
const technicalProfileSchema = z.object({
  score: z.int(),
  assessments: z._default(z.array(criterionAssessmentSchema), []),
  breakdown: nullable(scoreBreakdownSchema),
});
const skillEvidenceSchema = z.object({
  skillId: z.string(),
  skill: z.string(),
  status: evidenceStatusSchema,
  confidence: nullable(z.number()),
  evidence: stringArraySchema,
});
const skillEvidenceAnalysisSchema = z.object({ skills: z._default(z.array(skillEvidenceSchema), []) });
const skillGapSchema = z.object({
  skillId: z.string(),
  skill: z.string(),
  marketFrequency: z.number(),
  candidateStatus: evidenceStatusSchema,
  priority: z.enum(['HIGH', 'MEDIUM', 'LOW']),
  estimatedCoverageGain: z.number(),
});
const skillGapAnalysisSchema = z.object({ gaps: z._default(z.array(skillGapSchema), []) });
const skillRoiSchema = z.object({
  skillId: z.string(),
  skill: z.string(),
  roiScore: z.number(),
  marketDemand: z.number(),
  currentGap: z.enum(['HIGH', 'MEDIUM', 'LOW']),
  learningEffort: effortSchema,
  estimatedCoverageGain: z.number(),
});
const skillRoiAnalysisSchema = z.object({ skills: z._default(z.array(skillRoiSchema), []) });
const gradeFitSchema = z.object({
  candidateLevel: candidateLevelSchema,
  targetLevel: candidateLevelSchema,
  fit: z.enum([
    'STRONG_MATCH',
    'MATCH',
    'SLIGHTLY_OVERQUALIFIED',
    'SLIGHTLY_UNDERQUALIFIED',
    'OVERQUALIFIED',
    'UNDERQUALIFIED',
    'UNKNOWN',
  ]),
  severity: z.enum(['NONE', 'LOW', 'MODERATE', 'HIGH', 'UNKNOWN']),
  score: z.int(),
  breakdown: nullable(scoreBreakdownSchema),
});
const fieldDiagnosticSchema = z.object({
  field: z.string(),
  status: z.enum(['OK', 'PARTIAL', 'FAILED']),
  issues: stringArraySchema,
});
const atsAnalysisSchema = z.object({
  score: z.int(),
  parsing: z.int(),
  sections: z.int(),
  contacts: z.int(),
  experience: z.int(),
  education: z.int(),
  skills: z.int(),
  keywordCoverage: z.int(),
  diagnostics: z._default(z.array(fieldDiagnosticSchema), []),
  breakdown: nullable(scoreBreakdownSchema),
});
const blockerSchema = z.object({
  type: z.enum(['EXPERIENCE', 'SKILL', 'GRADE', 'TECHNOLOGY']),
  required: z.string(),
  actual: z.string(),
  severity: z.enum(['HIGH', 'MEDIUM', 'LOW']),
});
const vacancyFitAnalysisSchema = z.object({
  score: z.int(),
  mustHaveCoverage: z.int(),
  niceToHaveCoverage: z.int(),
  experienceFit: z.int(),
  gradeFit: z.int(),
  technicalFit: z.int(),
  applyRecommendation: z.enum(['STRONG_APPLY', 'APPLY', 'APPLY_WITH_RISK', 'LOW_PRIORITY', 'SKIP']),
  blockers: z._default(z.array(blockerSchema), []),
  breakdown: nullable(scoreBreakdownSchema),
});
const legacyVacancyFitSchema = z.object({
  requiredSkills: stringArraySchema,
  optionalSkills: stringArraySchema,
  missingSkills: stringArraySchema,
  experienceRelevanceScore: z.int(),
  candidateLevelFit: z.string(),
  risks: stringArraySchema,
  probableRejectionReasons: stringArraySchema,
});
const claimRiskSchema = z.object({
  claim: z.string(),
  valueScore: z.int(),
  credibilityScore: z.int(),
  interviewRisk: z.int(),
  evidenceQuality: z.int(),
  recommendation: z.enum(['KEEP', 'KEEP_AND_PREPARE', 'CLARIFY', 'SOFTEN', 'REMOVE']),
  explanation: z.string(),
});
const claimRiskAnalysisSchema = z.object({ claims: z._default(z.array(claimRiskSchema), []) });
const interviewRiskSchema = z.object({
  topic: z.string(),
  risk: z.enum(['HIGH', 'MEDIUM', 'LOW']),
  sourceClaim: z.string(),
  questions: stringArraySchema,
});
const interviewRiskAnalysisSchema = z.object({ topics: z._default(z.array(interviewRiskSchema), []) });
const resumeRiskSchema = z.object({
  type: z.enum(['SKILL_GAP', 'ATS', 'EXPERIENCE', 'GRADE', 'CLAIM', 'VACANCY_BLOCKER', 'DATA_QUALITY']),
  severity: riskSeveritySchema,
  subjectKey: z.string(),
  title: z.string(),
  evidence: z.string(),
  impact: z.string(),
  action: z.string(),
});
const recommendationSchema = z.object({
  title: z.string(),
  category: z.enum(['ATS', 'SKILL', 'EXPERIENCE', 'CLAIM', 'VACANCY']),
  priority: prioritySchema,
  effort: effortSchema,
  expectedImpact: z.record(z.string(), z.int()),
  reason: z.string(),
});
const recommendationAnalysisSchema = z.object({ items: z._default(z.array(recommendationSchema), []) });

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
  experience: z.object({ commercialMonths: z.int(), commercialYears: z.int(), remainingMonths: z.int() }),
  skills: z.object({ confirmed: stringArraySchema, weakEvidence: stringArraySchema, missing: stringArraySchema }),
  strengths: stringArraySchema,
  weaknesses: stringArraySchema,
  atsIssues: stringArraySchema,
  recommendations: stringArraySchema,
  vacancyFit: nullable(z.union([vacancyFitAnalysisSchema, legacyVacancyFitSchema])),
  market: z.object({ source: z.string(), sampleSize: z.int() }),
  metadata: z.object({
    analysisSchemaVersion: nullable(z.int()),
    analysisProfile: analysisProfileSchema,
    analysisVersion: z.string(),
    baselineVersion: z.string(),
    marketProfileVersion: nullable(z.string()),
    marketProfileSource: nullable(z.enum(['LIVE', 'CACHED', 'FALLBACK'])),
    generatedAt: z.string(),
    provider: aiProviderSchema,
    model: nullable(z.string()),
  }),
  marketFit: nullable(marketFitSchema),
  marketPosition: nullable(marketPositionSchema),
  technicalProfile: nullable(technicalProfileSchema),
  skillEvidence: nullable(skillEvidenceAnalysisSchema),
  skillGaps: nullable(skillGapAnalysisSchema),
  skillRoi: nullable(skillRoiAnalysisSchema),
  gradeFit: nullable(gradeFitSchema),
  ats: nullable(atsAnalysisSchema),
  claimRisks: nullable(claimRiskAnalysisSchema),
  interviewRisks: nullable(interviewRiskAnalysisSchema),
  risks: z._default(z.array(resumeRiskSchema), []),
  recommendationAnalysis: nullable(recommendationAnalysisSchema),
  markdownReport: nullable(z.string()),
  warnings: stringArraySchema,
});

export const resumeAnalysisResultSchema = z.pipe(
  rawResumeAnalysisResultSchema,
  z.transform((value) => ({
    ...value,
    vacancyFit: value.vacancyFit ?? undefined,
    marketFit: value.marketFit ?? undefined,
    marketPosition: value.marketPosition ?? undefined,
    technicalProfile: value.technicalProfile ?? undefined,
    skillEvidence: value.skillEvidence ?? undefined,
    skillGaps: value.skillGaps ?? undefined,
    skillRoi: value.skillRoi ?? undefined,
    gradeFit: value.gradeFit ?? undefined,
    ats: value.ats ?? undefined,
    claimRisks: value.claimRisks ?? undefined,
    interviewRisks: value.interviewRisks ?? undefined,
    recommendationAnalysis: value.recommendationAnalysis ?? undefined,
    markdownReport: value.markdownReport ?? undefined,
    metadata: {
      ...value.metadata,
      analysisSchemaVersion: value.metadata.analysisSchemaVersion ?? undefined,
      marketProfileVersion: value.metadata.marketProfileVersion ?? undefined,
      marketProfileSource: value.metadata.marketProfileSource ?? undefined,
      model: value.metadata.model ?? undefined,
    },
  })),
);

export type ResumeAnalysisResult = z.infer<typeof resumeAnalysisResultSchema>;
export type MarketFitAnalysis = NonNullable<ResumeAnalysisResult['marketFit']>;
export type TechnicalProfile = NonNullable<ResumeAnalysisResult['technicalProfile']>;
export type SkillEvidence = NonNullable<ResumeAnalysisResult['skillEvidence']>['skills'][number];
export type SkillGap = NonNullable<ResumeAnalysisResult['skillGaps']>['gaps'][number];
export type SkillRoi = NonNullable<ResumeAnalysisResult['skillRoi']>['skills'][number];
export type ResumeRisk = ResumeAnalysisResult['risks'][number];

export interface AiProvidersResponse {
  defaultProvider: AiProviderType;
  providers: Array<{ id: AiProviderType; available: boolean }>;
}
export interface ApiErrorResponse {
  error: { code: string; message: string };
}
export interface AnalyzeResumeOptions {
  provider?: AiProviderType;
  profile: AnalysisProfile;
  analysis?: import('./vacancy').VacancyAnalysisRequest;
  signal?: AbortSignal;
}
