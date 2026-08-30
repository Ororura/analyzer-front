export interface Salary {
  from?: number;
  to?: number;
  currency?: string;
  gross?: boolean;
}

export type VacancyLevel = "JUNIOR" | "MIDDLE" | "SENIOR";
export type WorkFormat = "REMOTE" | "OFFICE" | "HYBRID";
export type VacancySort = "RELEVANCE" | "DATE" | "SALARY_DESC";
export type VacancyPageSize = 20 | 50;

export interface VacancySearchCriteria {
  query?: string;
  area?: string;
  employer?: string;
  level?: VacancyLevel;
  workFormat?: WorkFormat;
  salaryFrom?: number;
  salaryTo?: number;
  currency?: string;
  salaryOnly?: boolean;
  technologies?: string[];
  publishedFrom?: string;
  sort?: VacancySort;
  page: number;
  pageSize: VacancyPageSize;
}

export interface VacancySummary {
  id: string;
  hhId?: string;
  title?: string;
  company?: string;
  salary?: Salary;
  experience?: string;
  workFormat?: string;
  location?: string;
  publishedAt?: string;
  url?: string;
  skills: string[];
  requirements: string[];
  source?: string;
}

export interface VacancyDetails extends VacancySummary {
  companyId?: string;
  description?: string;
  responsibilities: string[];
  employment?: string;
  schedule?: string;
  normalizedAt?: string;
}

export interface VacancySearchResponse {
  items: VacancySummary[];
  page: number;
  pageSize: number;
  totalPages?: number;
  totalElements?: number;
  warnings: string[];
  pagination?: {
    page?: number;
    pageSize?: number;
    totalPages?: number;
    hasNext?: boolean;
  };
}

export type VacancySelection =
  | { mode: "SELECTED"; vacancyIds: string[] }
  | {
      mode: "ALL_MATCHING";
      criteria: VacancySearchCriteria;
      excludedVacancyIds: string[];
    };

export type VacancyAnalysisRequest =
  | { mode: "AUTO_MARKET" }
  | { mode: "SINGLE_VACANCY"; vacancyId: string }
  | { mode: "SELECTED_VACANCIES"; selection: VacancySelection };

export interface VacancyAnalysisContext {
  mode: VacancyAnalysisRequest["mode"];
  vacancyTitle?: string;
  vacancyCompany?: string;
}

export const DEFAULT_VACANCY_CRITERIA: VacancySearchCriteria = {
  query: "Java Backend Developer",
  sort: "RELEVANCE",
  page: 0,
  pageSize: 20,
};
