import { z } from "zod";

export const ScoreSchema = z.number().int().min(0).max(100);
const TenPointScoreSchema = z.number().int().min(0).max(10);
export const EvidenceSchema = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? null : value),
  z.string().trim().min(1).nullable(),
);

export const ExperienceDateSchema = z
  .string()
  .regex(/^\d{4}(?:-(?:0[1-9]|1[0-2])(?:-(?:0[1-9]|[12]\d|3[01]))?)?$/)
  .nullable();
export const ExperienceEndDateSchema = z.union([ExperienceDateSchema, z.literal("present")]);

export const ExtractedExperiencePeriodSchema = z
  .object({
    startDate: ExperienceDateSchema,
    endDate: ExperienceEndDateSchema,
  })
  .strict();

const AiExperienceAssessmentSchema = z
  .object({
    periods: z.array(ExtractedExperiencePeriodSchema),
    evidence: EvidenceSchema,
  })
  .strict()
  .superRefine((value, context) => {
    if (value.periods.length > 0 && value.evidence === null) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["evidence"],
        message: "Для извлечённых периодов требуется evidence",
      });
    }
  });

export const ExperienceAssessmentSchema = z
  .object({
    value: z.string().trim().min(1).nullable(),
    evidence: EvidenceSchema,
  })
  .strict()
  .superRefine((value, context) => {
    if (value.value !== null && value.evidence === null) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["evidence"],
        message: "Для указанного опыта требуется evidence",
      });
    }
  });

export const FilterAssessmentSchema = z
  .object({
    status: z.enum(["match", "partial", "mismatch", "unknown"]),
    evidence: EvidenceSchema,
  })
  .strict()
  .superRefine((value, context) => {
    if (value.status === "unknown" && value.evidence !== null) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["evidence"],
        message: "unknown должен иметь evidence=null",
      });
    }
    if (value.status !== "unknown" && value.evidence === null) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["evidence"],
        message: "Подтверждённый статус требует evidence",
      });
    }
  });

const RawTechnologyAssessmentObjectSchema = z
  .object({
    technology: z.string().trim().min(1),
    status: z.enum([
      "confirmed_experience",
      "semantic_experience",
      "explicit_other",
      "skills_only",
      "missing",
      "irrelevant",
    ]),
    evidence: EvidenceSchema,
  })
  .strict();

export const RawTechnologyAssessmentSchema = RawTechnologyAssessmentObjectSchema.superRefine((value, context) => {
  if (value.status === "missing" && value.evidence !== null) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["evidence"],
      message: "missing должен иметь evidence=null",
    });
  }
  if (["confirmed_experience", "semantic_experience", "explicit_other"].includes(value.status) && value.evidence === null) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["evidence"],
      message: "Присутствующая технология требует evidence",
    });
  }
});

export const RecommendationSchema = z
  .object({
    priority: z.enum(["high", "medium", "low"]),
    section: z.string().trim().min(1),
    problem: z.string().trim().min(1),
    recommendation: z.string().trim().min(1),
    example: z.string().trim().min(1).optional(),
    evidence: EvidenceSchema,
  })
  .strict();

const ExperienceAnalysisBaseSchema = z
  .object({
    company: z.string().trim().min(1).nullable(),
    role: z.string().trim().min(1).nullable(),
    confirmedTechnologies: z.array(z.string().trim().min(1)),
    assessment: z.string().trim().min(1),
    issues: z.array(z.string().trim().min(1)),
    rewrites: z.array(
      z
        .object({
          original: z.string().trim().min(1),
          problem: z.string().trim().min(1),
          improved: z.string().trim().min(1),
        })
        .strict(),
    ),
  });

const AiExperienceAnalysisSchema = ExperienceAnalysisBaseSchema.extend({
  startDate: ExperienceDateSchema,
  endDate: ExperienceEndDateSchema,
}).strict();

const ExperienceAnalysisSchema = ExperienceAnalysisBaseSchema.extend({
  startDate: ExperienceDateSchema,
  endDate: ExperienceEndDateSchema,
  durationMonths: z.number().int().nonnegative().nullable(),
  isFuture: z.boolean().nullable(),
  isCurrent: z.boolean(),
}).strict();

export const BasicAnalysisSchema = z
  .object({
    level: z.enum(["junior", "junior_plus", "junior_middle", "middle", "insufficient_data"]),
    scores: z
      .object({
        java: TenPointScoreSchema,
        spring: TenPointScoreSchema,
        backend: TenPointScoreSchema,
        sqlPostgresql: TenPointScoreSchema,
        hibernateJpa: TenPointScoreSchema,
        infrastructure: TenPointScoreSchema,
        messagingCache: TenPointScoreSchema,
        testing: TenPointScoreSchema,
        commercialExperience: TenPointScoreSchema,
        projects: TenPointScoreSchema,
        experienceDescription: TenPointScoreSchema,
        levelFit: TenPointScoreSchema,
        ats: TenPointScoreSchema,
        resumeQuality: TenPointScoreSchema,
        education: TenPointScoreSchema,
      })
      .strict(),
    candidateStrength: TenPointScoreSchema,
    resumeQuality: TenPointScoreSchema,
    vacancyFit: TenPointScoreSchema.nullable(),
    hrScreeningChance: z.enum(["low", "medium", "high"]),
    technicalInterviewChance: z.enum(["low", "medium", "high"]),
    strengths: z.array(z.string().trim().min(1)),
    problems: z.array(z.string().trim().min(1)),
    experienceAnalysis: z.array(ExperienceAnalysisSchema),
    recommendedVacancies: z.array(z.string().trim().min(1)),
    beforeMassApplications: z.array(z.string().trim().min(1)),
    studyPriority: z.array(z.string().trim().min(1)),
    notNeededNow: z.array(z.string().trim().min(1)),
  })
  .strict();

const AiBasicAnalysisResponseSchema = BasicAnalysisSchema.omit({ experienceAnalysis: true })
  .extend({
    experienceAnalysis: z.array(AiExperienceAnalysisSchema),
    beforeMassApplications: z.array(z.string().trim().min(1)).default([]),
    studyPriority: z.array(z.string().trim().min(1)).default([]),
    notNeededNow: z.array(z.string().trim().min(1)).default([]),
  })
  .strict();

const RawAtsAnalysisObjectSchema = z
  .object({
    hhSearchMatch: ScoreSchema,
    recruiterReadability: ScoreSchema,
    detectedLevel: z.enum(["intern", "junior", "junior_plus", "middle", "middle_plus", "senior"]),
    targetLevelFit: ScoreSchema,
    experience: z
      .object({
        totalExperience: ExperienceAssessmentSchema,
        relevantJavaExperience: ExperienceAssessmentSchema,
        backendExperience: ExperienceAssessmentSchema,
        commercialExperience: ExperienceAssessmentSchema,
        projectExperience: ExperienceAssessmentSchema,
      })
      .strict(),
    structuredFilters: z
      .object({
        experience: FilterAssessmentSchema,
        education: FilterAssessmentSchema,
        location: FilterAssessmentSchema,
        relocation: FilterAssessmentSchema,
        salary: FilterAssessmentSchema,
        languages: FilterAssessmentSchema,
        employmentType: FilterAssessmentSchema,
        workFormat: FilterAssessmentSchema,
      })
      .strict(),
    technologies: z.array(RawTechnologyAssessmentSchema),
    scoreEvidence: z
      .object({
        hhSearchMatch: z.array(z.string().trim().min(1)),
        recruiterReadability: z.array(z.string().trim().min(1)),
        targetLevelFit: z.array(z.string().trim().min(1)),
      })
      .strict(),
    strengths: z.array(z.string().trim().min(1)),
    weaknesses: z.array(z.string().trim().min(1)),
    recruiterRisks: z.array(z.string().trim().min(1)),
    recommendations: z.array(RecommendationSchema),
    summary: z.string().trim().min(1),
  })
  .strict();

const AiRawAtsAnalysisObjectSchema = RawAtsAnalysisObjectSchema.omit({ experience: true })
  .extend({
    experience: z
      .object({
        totalExperience: AiExperienceAssessmentSchema,
        relevantJavaExperience: AiExperienceAssessmentSchema,
        backendExperience: AiExperienceAssessmentSchema,
        commercialExperience: AiExperienceAssessmentSchema,
        projectExperience: AiExperienceAssessmentSchema,
      })
      .strict(),
  })
  .strict();

const addDuplicateTechnologyIssues = (
  technologies: Array<{ technology: string }>,
  context: z.RefinementCtx,
): void => {
  const names = new Set<string>();
  for (const [index, assessment] of technologies.entries()) {
    const normalized = assessment.technology.toLocaleLowerCase("ru-RU");
    if (names.has(normalized)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["technologies", index, "technology"],
        message: "Технологии не должны дублироваться",
      });
    }
    names.add(normalized);
  }
};

export const RawAtsAnalysisSchema = RawAtsAnalysisObjectSchema.superRefine((value, context) => {
  addDuplicateTechnologyIssues(value.technologies, context);
});

const AiRawAtsAnalysisSchema = AiRawAtsAnalysisObjectSchema.superRefine((value, context) => {
  addDuplicateTechnologyIssues(value.technologies, context);
});

export const AiResumeAnalysisResponseSchema = z
  .object({
    basicAnalysis: AiBasicAnalysisResponseSchema,
    atsAnalysis: AiRawAtsAnalysisSchema,
  })
  .strict();

export const TechnologyAssessmentSchema = RawTechnologyAssessmentObjectSchema.extend({
  tier: z.enum(["core", "common", "bonus"]),
}).strict();

export const AtsAnalysisResultSchema = RawAtsAnalysisObjectSchema.omit({ technologies: true })
  .extend({
    atsScore: ScoreSchema,
    hhStructuredFilters: ScoreSchema,
    vacancyMatch: ScoreSchema,
    keywordCoverage: ScoreSchema,
    screeningChance: z.enum(["low", "below_average", "medium", "high", "very_high"]),
    technologies: z.array(TechnologyAssessmentSchema),
    keywords: z
      .object({
        explicitlyPresent: z.array(z.string()),
        semanticallyPresent: z.array(z.string()),
        confirmedByExperience: z.array(z.string()),
        skillsOnly: z.array(z.string()),
        missingCore: z.array(z.string()),
        missingCommon: z.array(z.string()),
        optional: z.array(z.string()),
        irrelevantKeywords: z.array(z.string()),
      })
      .strict(),
    marketData: z
      .object({
        source: z.enum(["live", "baseline"]),
        sampleSize: z.number().int().nonnegative(),
        warnings: z.array(z.string()),
      })
      .strict(),
  })
  .strict();

export const ResumeAnalysisResultSchema = z
  .object({
    basicAnalysis: BasicAnalysisSchema,
    atsAnalysis: AtsAnalysisResultSchema,
  })
  .strict();

export type AiResumeAnalysisResponse = z.infer<typeof AiResumeAnalysisResponseSchema>;
export type RawAtsAnalysis = z.infer<typeof RawAtsAnalysisSchema>;
export type FilterAssessment = z.infer<typeof FilterAssessmentSchema>;
export type TechnologyAssessment = z.infer<typeof TechnologyAssessmentSchema>;
export type AtsAnalysisResult = z.infer<typeof AtsAnalysisResultSchema>;
export type BasicAnalysis = z.infer<typeof BasicAnalysisSchema>;
export type ResumeAnalysisResult = z.infer<typeof ResumeAnalysisResultSchema>;
