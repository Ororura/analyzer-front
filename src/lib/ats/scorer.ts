import { AtsAnalysisResultSchema, type AtsAnalysisResult, type RawAtsAnalysis } from "@/lib/analysis/schema";
import { canonicalTechnology, TECHNOLOGY_TIERS, type TechnologyTier, type VacancyMarketData } from "./market-data";

type TechnologyStatus = RawAtsAnalysis["technologies"][number]["status"];
type DetectedLevel = RawAtsAnalysis["detectedLevel"];

const STATUS_CREDIT: Record<TechnologyStatus, number> = {
  confirmed_experience: 1,
  semantic_experience: 0.85,
  explicit_other: 0.75,
  skills_only: 0.5,
  missing: 0,
  irrelevant: 0,
};
const FILTER_CREDIT = { match: 100, partial: 60, mismatch: 0 } as const;

export const clampScore = (value: number): number => Math.min(100, Math.max(0, Math.round(value)));

export const calculateStructuredFiltersScore = (filters: RawAtsAnalysis["structuredFilters"]): number => {
  const known = Object.values(filters).filter((filter) => filter.status !== "unknown");
  if (known.length === 0) return 50;
  const total = known.reduce((sum, filter) => sum + FILTER_CREDIT[filter.status as keyof typeof FILTER_CREDIT], 0);
  return clampScore(total / known.length);
};

export const calculateAtsScore = (scores: {
  hhSearchMatch: number;
  hhStructuredFilters: number;
  vacancyMatch: number;
  keywordCoverage: number;
  recruiterReadability: number;
}): number =>
  clampScore(
    scores.hhSearchMatch * 0.2 +
      scores.hhStructuredFilters * 0.2 +
      scores.vacancyMatch * 0.25 +
      scores.keywordCoverage * 0.2 +
      scores.recruiterReadability * 0.15,
  );

export const calculateKeywordCoverage = (technologies: RawAtsAnalysis["technologies"], level: DetectedLevel): number =>
  weightedTechnologyCoverage(technologies, level, () => 1);

export const calculateVacancyMatch = (
  technologies: RawAtsAnalysis["technologies"],
  level: DetectedLevel,
  targetLevelFit: number,
  market: VacancyMarketData,
): number => {
  const skillCoverage = weightedTechnologyCoverage(
    technologies,
    level,
    (technology) => market.skillFrequencies[technology] ?? 0,
  );
  return clampScore(skillCoverage * 0.8 + targetLevelFit * 0.2);
};

const weightedTechnologyCoverage = (
  technologies: RawAtsAnalysis["technologies"],
  level: DetectedLevel,
  frequency: (technology: string) => number,
): number => {
  const assessments = new Map(technologies.map((item) => [canonicalTechnology(item.technology), item]));
  let earned = 0;
  let available = 0;
  for (const [technology, tier] of Object.entries(TECHNOLOGY_TIERS)) {
    const marketWeight = frequency(technology);
    if (marketWeight <= 0) continue;
    const assessment = assessments.get(technology);
    if (assessment?.status === "irrelevant") continue;
    const weight = tierWeight(tier, level) * marketWeight;
    available += weight;
    earned += weight * (assessment ? STATUS_CREDIT[assessment.status] : 0);
  }
  return available === 0 ? 0 : clampScore((earned / available) * 100);
};

const tierWeight = (tier: TechnologyTier, level: DetectedLevel): number => {
  if (tier === "core") return 5;
  if (tier === "common") return 2;
  return ["intern", "junior", "junior_plus"].includes(level) ? 0.5 : 1;
};

export const getScreeningChance = (score: number): "low" | "below_average" | "medium" | "high" | "very_high" => {
  if (score < 40) return "low";
  if (score < 55) return "below_average";
  if (score < 70) return "medium";
  if (score < 85) return "high";
  return "very_high";
};

export const finalizeAtsAnalysis = (raw: RawAtsAnalysis, market: VacancyMarketData): AtsAnalysisResult => {
  const technologies = raw.technologies.map((assessment) => {
    const technology = canonicalTechnology(assessment.technology);
    const tier: TechnologyTier = TECHNOLOGY_TIERS[technology] ?? "bonus";
    return { ...assessment, technology, tier };
  });
  const hhStructuredFilters = calculateStructuredFiltersScore(raw.structuredFilters);
  const keywordCoverage = calculateKeywordCoverage(technologies, raw.detectedLevel);
  const vacancyMatch = calculateVacancyMatch(technologies, raw.detectedLevel, raw.targetLevelFit, market);
  const atsScore = calculateAtsScore({
    hhSearchMatch: raw.hhSearchMatch,
    hhStructuredFilters,
    vacancyMatch,
    keywordCoverage,
    recruiterReadability: raw.recruiterReadability,
  });
  const names = (statuses: TechnologyStatus[], tier?: TechnologyTier) =>
    technologies
      .filter((item) => statuses.includes(item.status) && (!tier || item.tier === tier))
      .map((item) => item.technology);

  return AtsAnalysisResultSchema.parse({
    ...raw,
    technologies,
    atsScore,
    hhStructuredFilters,
    vacancyMatch,
    keywordCoverage,
    screeningChance: getScreeningChance(atsScore),
    keywords: {
      explicitlyPresent: names(["confirmed_experience", "explicit_other", "skills_only"]),
      semanticallyPresent: names(["semantic_experience"]),
      confirmedByExperience: names(["confirmed_experience", "semantic_experience"]),
      skillsOnly: names(["skills_only"]),
      missingCore: names(["missing"], "core"),
      missingCommon: names(["missing"], "common"),
      optional: names(["missing"], "bonus"),
      irrelevantKeywords: names(["irrelevant"]),
    },
    marketData: { source: market.source, sampleSize: market.sampleSize, warnings: market.warnings },
  });
};
