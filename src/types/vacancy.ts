export type Vacancy = {
  id: string;
  hhId: string;
  title: string;
  company: string;
  companyId: string;
  url: string;
  location?: string;
  salary?: {
    from?: number;
    to?: number;
    currency?: string;
    gross?: boolean;
  };
  description: string;
  skills: string[];
  requirements: string[];
  responsibilities: string[];
  experience?: string;
  employment?: string;
  schedule?: string;
  workFormat?: string;
  source: 'hh.ru';
  publishedAt?: string;
  normalizedAt: string;
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

export type VacancySearchResult = {
  items: Vacancy[];
  pagination: {
    page: number;
    pageSize: number;
    totalPages?: number;
    hasNext: boolean;
  };
  warnings: string[];
};
