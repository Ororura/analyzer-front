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
  source: 'hh.ru';
  publishedAt?: string;
  normalizedAt: string;
};
