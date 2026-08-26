export type ParsedSalary = {
  from?: number;
  to?: number;
  currency?: string;
  gross?: boolean;
};

export type ParsedVacancy = {
  id: string;
  url: string;
  title: string;
  company?: string;
  companyId?: string;
  salary?: ParsedSalary;
  location?: string;
  experience?: string;
  snippet?: string;
  description?: string;
  skills?: string[];
  requirements?: string[];
  responsibilities?: string[];
  employment?: string;
  schedule?: string;
  workFormat?: string;
  publishedAt?: string;
};

export type ParsedSearchPage = {
  items: ParsedVacancy[];
  totalPages?: number;
  hasNext: boolean;
  warnings: string[];
};
