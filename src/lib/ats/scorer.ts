import { match } from "ts-pattern";
import { AtsAnalysisResultSchema, type AtsAnalysisResult, type RawAtsAnalysis } from "@/lib/analysis/schema";
import { canonicalTechnology, TECHNOLOGY_TIERS, type TechnologyTier, type VacancyMarketData } from "./market-data";

type TechnologyStatus = RawAtsAnalysis["technologies"][number]["status"];
type DetectedLevel = RawAtsAnalysis["detectedLevel"];

export const TECHNOLOGY_STATUS_WEIGHT: Record<TechnologyStatus, number> = {
  confirmed_experience: 1,
  semantic_experience: 0.85,
  explicit_other: 0.75,
  skills_only: 0.5,
  missing: 0,
  irrelevant: 0,
};
export const FILTER_STATUS_WEIGHT = { match: 100, partial: 60, mismatch: 0 } as const;
export const ATS_COMPONENT_WEIGHT = {
  hhSearchMatch: 0.2,
  hhStructuredFilters: 0.2,
  vacancyMatch: 0.25,
  keywordCoverage: 0.2,
  recruiterReadability: 0.15,
} as const;
const VACANCY_MATCH_COMPONENT_WEIGHT = { skillCoverage: 0.8, targetLevelFit: 0.2 } as const;
const TECHNOLOGY_TIER_WEIGHT = { core: 5, common: 2, bonus: 1, juniorBonus: 0.5 } as const;
const SCORE_RANGE = { min: 0, max: 100 } as const;
const NO_KNOWN_FILTERS_SCORE = 50;
const SCREENING_SCORE_THRESHOLD = { belowAverage: 40, medium: 55, high: 70, veryHigh: 85 } as const;

const technologyStatusWeight = (status: TechnologyStatus): number =>
  match(status)
    .with("confirmed_experience", () => TECHNOLOGY_STATUS_WEIGHT.confirmed_experience)
    .with("semantic_experience", () => TECHNOLOGY_STATUS_WEIGHT.semantic_experience)
    .with("explicit_other", () => TECHNOLOGY_STATUS_WEIGHT.explicit_other)
    .with("skills_only", () => TECHNOLOGY_STATUS_WEIGHT.skills_only)
    .with("missing", () => TECHNOLOGY_STATUS_WEIGHT.missing)
    .with("irrelevant", () => TECHNOLOGY_STATUS_WEIGHT.irrelevant)
    .exhaustive();

const filterStatusWeight = (status: RawAtsAnalysis["structuredFilters"][keyof RawAtsAnalysis["structuredFilters"]]["status"]): number | null =>
  match(status)
    .with("match", () => FILTER_STATUS_WEIGHT.match)
    .with("partial", () => FILTER_STATUS_WEIGHT.partial)
    .with("mismatch", () => FILTER_STATUS_WEIGHT.mismatch)
    .with("unknown", () => null)
    .exhaustive();

export const clampScore = (value: number): number =>
  Math.min(SCORE_RANGE.max, Math.max(SCORE_RANGE.min, Math.round(value)));

export const calculateStructuredFiltersScore = (filters: RawAtsAnalysis["structuredFilters"]): number => {
  const knownWeights = Object.values(filters)
    .map((filter) => filterStatusWeight(filter.status))
    .filter((weight): weight is number => weight !== null);
  if (knownWeights.length === 0) return NO_KNOWN_FILTERS_SCORE;
  return clampScore(knownWeights.reduce((sum, weight) => sum + weight, 0) / knownWeights.length);
};

export const calculateAtsScore = (scores: {
  hhSearchMatch: number;
  hhStructuredFilters: number;
  vacancyMatch: number;
  keywordCoverage: number;
  recruiterReadability: number;
}): number =>
  clampScore(
    scores.hhSearchMatch * ATS_COMPONENT_WEIGHT.hhSearchMatch +
      scores.hhStructuredFilters * ATS_COMPONENT_WEIGHT.hhStructuredFilters +
      scores.vacancyMatch * ATS_COMPONENT_WEIGHT.vacancyMatch +
      scores.keywordCoverage * ATS_COMPONENT_WEIGHT.keywordCoverage +
      scores.recruiterReadability * ATS_COMPONENT_WEIGHT.recruiterReadability,
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
  return clampScore(
    skillCoverage * VACANCY_MATCH_COMPONENT_WEIGHT.skillCoverage +
      targetLevelFit * VACANCY_MATCH_COMPONENT_WEIGHT.targetLevelFit,
  );
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
    earned += weight * (assessment ? technologyStatusWeight(assessment.status) : TECHNOLOGY_STATUS_WEIGHT.missing);
  }
  return available === 0 ? SCORE_RANGE.min : clampScore((earned / available) * SCORE_RANGE.max);
};

const tierWeight = (tier: TechnologyTier, level: DetectedLevel): number => {
  return match(tier)
    .with("core", () => TECHNOLOGY_TIER_WEIGHT.core)
    .with("common", () => TECHNOLOGY_TIER_WEIGHT.common)
    .with("bonus", () =>
      ["intern", "junior", "junior_plus"].includes(level)
        ? TECHNOLOGY_TIER_WEIGHT.juniorBonus
        : TECHNOLOGY_TIER_WEIGHT.bonus,
    )
    .exhaustive();
};

export const getScreeningChance = (score: number): "low" | "below_average" | "medium" | "high" | "very_high" => {
  if (score < SCREENING_SCORE_THRESHOLD.belowAverage) return "low";
  if (score < SCREENING_SCORE_THRESHOLD.medium) return "below_average";
  if (score < SCREENING_SCORE_THRESHOLD.high) return "medium";
  if (score < SCREENING_SCORE_THRESHOLD.veryHigh) return "high";
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
