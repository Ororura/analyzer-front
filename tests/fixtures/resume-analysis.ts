import type { ResumeAnalysisResult } from "@/types/resume-analysis";

export const resumeAnalysisResult: ResumeAnalysisResult = {
  targetRole: "Java Backend Developer",
  detectedLevel: "middle_minus",
  scores: {
    java: 8, spring: 7, backend: 9, sqlPostgresql: 6, hibernateJpa: 5,
    infrastructure: 4, messagingCache: 3, testing: 7, commercialExperience: 6,
    experienceDescription: 5, ats: 73, resumeQuality: 81,
  },
  overallScore: 67,
  candidateStrength: 71,
  hrScreeningChance: "HIGH",
  technicalInterviewChance: "MEDIUM",
  experience: { commercialMonths: 29, commercialYears: 2, remainingMonths: 5 },
  skills: { confirmed: ["Java", "Spring"], weakEvidence: ["Kafka"], missing: ["Kubernetes"] },
  strengths: ["Сильная Java база"],
  weaknesses: ["Мало инфраструктуры"],
  atsIssues: ["Нет измеримых результатов"],
  recommendations: ["Добавить метрики"],
  market: { source: "hh", sampleSize: 120 },
  metadata: {
    analysisVersion: "2", baselineVersion: "2026-08", generatedAt: "2026-08-28T10:00:00Z",
    provider: "CODEX_CLI", model: null,
  },
  warnings: [],
};
