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

export const structuredResumeAnalysisResult: ResumeAnalysisResult = {
  ...resumeAnalysisResult,
  metadata: { ...resumeAnalysisResult.metadata, analysisSchemaVersion: 2 },
  marketFit: {
    score: 84, mustHaveCoverage: 93, niceToHaveCoverage: 74, matchedVacancyPercentage: 61,
    targetLevel: "middle_minus", breakdown: { score: 84, components: [
      { name: "mustHaveCoverage", score: 93, weight: 0.4, contribution: 37.2, explanation: "Ключевые требования" },
      { name: "experience", score: 70, weight: 0.2, contribution: 14, explanation: null },
    ] },
  },
  marketPosition: { juniorPercentile: 82, juniorPlusPercentile: 61, middleMinusPercentile: null },
  technicalProfile: { score: 76, assessments: [
    { criterionId: "java", score: 7, evidence: ["Java 17 в коммерческом проекте"] },
    { criterionId: "spring_backend", score: 8, evidence: ["Spring Boot"] },
  ], breakdown: null },
  skillEvidence: { skills: [
    { skillId: "java", skill: "Java", status: "STRONG", confidence: 0.91, evidence: ["Разрабатывал сервисы на Java 17"] },
    { skillId: "rabbitmq", skill: "RabbitMQ", status: "MENTION_ONLY", confidence: null, evidence: [] },
    { skillId: "testcontainers", skill: "Testcontainers", status: "NOT_FOUND", confidence: 0, evidence: [] },
  ] },
  skillGaps: { gaps: [
    { skillId: "testcontainers", skill: "Testcontainers", marketFrequency: 0.27, candidateStatus: "NOT_FOUND", priority: "HIGH", estimatedCoverageGain: 0.11 },
  ] },
  skillRoi: { skills: [
    { skillId: "testcontainers", skill: "Testcontainers", roiScore: 9.2, marketDemand: 0.31, currentGap: "HIGH", learningEffort: "LOW", estimatedCoverageGain: 0.12 },
  ] },
  gradeFit: { candidateLevel: "junior_plus", targetLevel: "middle_minus", fit: "SLIGHTLY_UNDERQUALIFIED", severity: "MODERATE", score: 68, breakdown: null },
  ats: { score: 86, parsing: 72, sections: 94, contacts: 100, experience: 91, education: 63, skills: 78, keywordCoverage: 88,
    diagnostics: [{ field: "education", status: "PARTIAL", issues: ["Не удалось точно определить дату начала обучения."] }], breakdown: null },
  vacancyFit: undefined,
  claimRisks: { claims: [{ claim: "Сократил время запросов", valueScore: 9, credibilityScore: 8, interviewRisk: 7, evidenceQuality: 7, recommendation: "KEEP_AND_PREPARE", explanation: "Подготовить методику измерения" }] },
  interviewRisks: { topics: [{ topic: "PostgreSQL optimization", risk: "HIGH", sourceClaim: "Сократил время запросов", questions: ["Что показал EXPLAIN ANALYZE?"] }] },
  risks: [{ type: "EXPERIENCE", severity: "MEDIUM", subjectKey: "experience", title: "Ограниченный коммерческий опыт", evidence: "1 год 4 месяца", impact: "Часть вакансий требует 2+ лет", action: "Фокус на Junior+" }],
  recommendationAnalysis: { items: [{ title: "Исправить переносы строк", category: "ATS", priority: "HIGH", effort: "LOW", expectedImpact: { ats: 6 }, reason: "Секции распознаются некорректно" }] },
  markdownReport: "# Полный отчёт\n\nПодробности анализа.",
};
