import type { Vacancy } from "@/types/vacancy";
import { normalizeSkill } from "@/lib/vacancies/normalizer";

export type TechnologyTier = "core" | "common" | "bonus";

export interface VacancyMarketData {
  source: "live" | "baseline";
  sampleSize: number;
  skillFrequencies: Record<string, number>;
  experienceRequirements: Record<string, number>;
  employmentTypes: Record<string, number>;
  workFormats: Record<string, number>;
  warnings: string[];
}

export const TECHNOLOGY_TIERS: Record<string, TechnologyTier> = {
  Java: "core",
  "Spring Boot": "core",
  "REST API": "core",
  SQL: "core",
  PostgreSQL: "core",
  Git: "core",
  "Backend development": "core",
  "Hibernate/JPA": "common",
  Docker: "common",
  Testing: "common",
  "Maven/Gradle": "common",
  "Spring Data": "common",
  "Spring Security": "common",
  Kafka: "bonus",
  RabbitMQ: "bonus",
  Redis: "bonus",
  Kubernetes: "bonus",
  Microservices: "bonus",
  Prometheus: "bonus",
  Grafana: "bonus",
  Linux: "bonus",
  "CI/CD": "bonus",
};

const BASELINE_FREQUENCIES: Record<string, number> = {
  Java: 0.93,
  "Spring Boot": 0.89,
  "REST API": 0.82,
  SQL: 0.81,
  PostgreSQL: 0.68,
  Git: 0.65,
  "Backend development": 0.9,
  "Hibernate/JPA": 0.61,
  Docker: 0.54,
  Testing: 0.52,
  "Maven/Gradle": 0.49,
  "Spring Data": 0.45,
  "Spring Security": 0.39,
  Kafka: 0.41,
  RabbitMQ: 0.18,
  Redis: 0.27,
  Kubernetes: 0.19,
  Microservices: 0.35,
  Prometheus: 0.14,
  Grafana: 0.13,
  Linux: 0.29,
  "CI/CD": 0.31,
};

const CANONICAL_ALIASES: Array<[RegExp, string]> = [
  [/^java(?:\s+\d+)?$/i, "Java"],
  [/spring\s*boot/i, "Spring Boot"],
  [/^(?:spring|spring framework)$/i, "Spring Boot"],
  [/(?:rest(?:ful)?(?:\s*api|\s*endpoint|\s*service)?|web api)/i, "REST API"],
  [/postgres/i, "PostgreSQL"],
  [/^(?:sql|mysql|oracle|mariadb|relational database)$/i, "SQL"],
  [/(?:hibernate|\bjpa\b)/i, "Hibernate/JPA"],
  [/(?:maven|gradle)/i, "Maven/Gradle"],
  [/(?:junit|mockito|testcontainers|unit test|integration test)/i, "Testing"],
  [/spring\s*data/i, "Spring Data"],
  [/spring\s*security/i, "Spring Security"],
  [/microservice/i, "Microservices"],
  [/(?:ci\/?cd|continuous integration)/i, "CI/CD"],
  [/backend/i, "Backend development"],
];

export const canonicalTechnology = (value: string): string => {
  const normalized = normalizeSkill(value);
  for (const [pattern, canonical] of CANONICAL_ALIASES) {
    if (pattern.test(normalized)) return canonical;
  }
  return Object.keys(TECHNOLOGY_TIERS).find((skill) => skill.toLowerCase() === normalized.toLowerCase()) ?? normalized;
};

export const createBaselineMarketData = (warning?: string): VacancyMarketData => ({
  source: "baseline",
  sampleSize: 0,
  skillFrequencies: { ...BASELINE_FREQUENCIES },
  experienceRequirements: {},
  employmentTypes: {},
  workFormats: {},
  warnings: warning ? [warning] : [],
});

export const aggregateVacancyMarketData = (vacancies: Vacancy[], warnings: string[] = []): VacancyMarketData => {
  if (vacancies.length === 0) return createBaselineMarketData(warnings[0] ?? "HH.ru не вернул актуальные вакансии");
  const counts = new Map<string, number>();
  const experienceRequirements: Record<string, number> = {};
  const employmentTypes: Record<string, number> = {};
  const workFormats: Record<string, number> = {};
  for (const vacancy of vacancies) {
    const skills = new Set(vacancy.skills.map(canonicalTechnology).filter((skill) => skill in TECHNOLOGY_TIERS));
    for (const skill of skills) counts.set(skill, (counts.get(skill) ?? 0) + 1);
    increment(experienceRequirements, vacancy.experience);
    increment(employmentTypes, vacancy.employment);
    increment(workFormats, vacancy.workFormat ?? vacancy.schedule);
  }
  return {
    source: "live",
    sampleSize: vacancies.length,
    skillFrequencies: {
      ...BASELINE_FREQUENCIES,
      ...Object.fromEntries(
        [...counts.entries()].map(([skill, count]) => [skill, Math.round((count / vacancies.length) * 100) / 100]),
      ),
    },
    experienceRequirements,
    employmentTypes,
    workFormats,
    warnings,
  };
};

const increment = (target: Record<string, number>, value?: string): void => {
  if (value) target[value] = (target[value] ?? 0) + 1;
};

export const compactMarketData = (market: VacancyMarketData): Omit<VacancyMarketData, "warnings"> => ({
  source: market.source,
  sampleSize: market.sampleSize,
  skillFrequencies: market.skillFrequencies,
  experienceRequirements: market.experienceRequirements,
  employmentTypes: market.employmentTypes,
  workFormats: market.workFormats,
});
