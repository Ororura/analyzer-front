export type Salary = {
  from?: number;
  to?: number;
  currency?: string;
  gross?: boolean;
};

export type Vacancy = {
  id?: string;
  hhId?: string;
  title?: string;
  company?: string;
  companyId?: string;
  url?: string;
  location?: string;
  salary?: Salary;
  description?: string;
  skills?: string[];
  requirements?: string[];
  responsibilities?: string[];
  experience?: string;
  employment?: string;
  schedule?: string;
  workFormat?: string;
  source?: string;
  publishedAt?: string;
  normalizedAt?: string;
};

export type VacancySearchFilters = {
  text?: string;
  page?: number;
  perPage?: number;
  experience?: string[];
  employment?: string[];
  schedule?: string[];
  salary?: number;
  location?: string;
};

export type Pagination = {
  page?: number;
  pageSize?: number;
  totalPages?: number;
  hasNext?: boolean;
};

export type VacancySearchResult = {
  items?: Vacancy[];
  pagination?: Pagination;
  warnings?: string[];
};
