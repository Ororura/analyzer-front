export type AiProviderType = "POLZA" | "CODEX_CLI";

export type CandidateLevel = "junior" | "junior_plus" | "middle_minus" | "middle";

export type InterviewChance = "LOW" | "MEDIUM" | "HIGH";

export interface ResumeAnalysisResult {
  targetRole: string;
  detectedLevel: CandidateLevel;
  scores: {
    java: number;
    spring: number;
    backend: number;
    sqlPostgresql: number;
    hibernateJpa: number;
    infrastructure: number;
    messagingCache: number;
    testing: number;
    commercialExperience: number;
    experienceDescription: number;
    ats: number;
    resumeQuality: number;
  };
  overallScore: number;
  candidateStrength: number;
  hrScreeningChance: InterviewChance;
  technicalInterviewChance: InterviewChance;
  experience: {
    commercialMonths: number;
    commercialYears: number;
    remainingMonths: number;
  };
  skills: {
    confirmed: string[];
    weakEvidence: string[];
    missing: string[];
  };
  strengths: string[];
  weaknesses: string[];
  atsIssues: string[];
  recommendations: string[];
  market: {
    source: string;
    sampleSize: number;
  };
  metadata: {
    analysisVersion: string;
    baselineVersion: string;
    generatedAt: string;
    provider: AiProviderType;
    model: string | null;
  };
  warnings: string[];
}

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
  signal?: AbortSignal;
}
