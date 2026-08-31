import type { ResumeAnalysisResult } from "@/types/resume-analysis";

export const resumeAnalysisResult: ResumeAnalysisResult = {
  targetRole: "Java Backend Developer",
  detectedLevel: "middle_minus",
  scores: {
    assessments: [
      { criterionId: "java", score: 8, evidence: ["Разрабатывал сервисы на Java 17"] },
      { criterionId: "spring_backend", score: 7, evidence: ["Использовал Spring Boot"] },
      { criterionId: "databases", score: 6, evidence: [] },
    ],
    commercialExperience: 6,
    experienceDescription: 5,
    ats: 73,
    resumeQuality: 81,
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
    analysisProfile: "JAVA_BACKEND",
    analysisVersion: "3",
    baselineVersion: "2026-08",
    marketProfileVersion: "market-java-2026-08",
    marketProfileSource: "LIVE",
    generatedAt: "2026-08-28T10:00:00Z",
    provider: "CODEX_CLI",
  },
  warnings: [],
};

export const reactResumeAnalysisResult: ResumeAnalysisResult = {
  ...resumeAnalysisResult,
  targetRole: "React Frontend Developer",
  scores: {
    ...resumeAnalysisResult.scores,
    assessments: [
      { criterionId: "javascript", score: 8, evidence: ["Разрабатывал интерфейсы на JavaScript"] },
      { criterionId: "typescript", score: 7, evidence: ["Типизировал API responses"] },
      { criterionId: "react", score: 9, evidence: ["Создавал React-компоненты"] },
      { criterionId: "frontend_architecture", score: 7, evidence: [] },
    ],
  },
  skills: { confirmed: ["React", "TypeScript"], weakEvidence: ["Next.js"], missing: ["React Testing Library"] },
  metadata: { ...resumeAnalysisResult.metadata, analysisProfile: "REACT_FRONTEND", marketProfileVersion: "market-react-2026-08" },
};

export const goResumeAnalysisResult: ResumeAnalysisResult = {
  ...resumeAnalysisResult,
  targetRole: "Go Backend Developer",
  scores: {
    ...resumeAnalysisResult.scores,
    assessments: [
      { criterionId: "go", score: 8, evidence: ["Разрабатывал сервисы на Go"] },
      { criterionId: "concurrency", score: 7, evidence: [] },
      { criterionId: "databases", score: 6, evidence: [] },
      { criterionId: "distributed_systems", score: 5, evidence: [] },
    ],
  },
  metadata: { ...resumeAnalysisResult.metadata, analysisProfile: "GO_BACKEND" },
};
