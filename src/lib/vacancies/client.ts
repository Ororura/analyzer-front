import type { Vacancy } from '@/types/vacancy';

const API_BASE_URL = 'https://api.hh.ru';

export const fetchVacancies = async (filters: Record<string, any> = {}): Promise<Vacancy[]> => {
  try {
    const params = new URLSearchParams();
    
    params.set('text', filters.text || 'Java Backend Developer');
    params.set('page', (filters.page || 0).toString());
    params.set('per_page', (filters.perPage || 50).toString());
    
    if (filters.experience) {
      filters.experience.forEach((exp: string) => params.append('experience', exp));
    }
    
    if (filters.employment) {
      filters.employment.forEach((emp: string) => params.append('employment', emp));
    }
    
    if (filters.schedule) {
      filters.schedule.forEach((sched: string) => params.append('schedule', sched));
    }
    
    if (filters.salary) {
      params.set('salary', filters.salary.toString());
    }
    
    if (filters.location) {
      params.set('area', filters.location);
    }
    
    const response = await fetch(`${API_BASE_URL}/vacancies?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error(`HH API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    return data.items ? data.items.map((item: any) => parseHhVacancy(item)) : [];
  } catch (error) {
    console.error('Failed to fetch vacancies:', error);
    throw error;
  }
};

export const fetchVacancyById = async (hhId: string): Promise<Vacancy> => {
  try {
    const response = await fetch(`${API_BASE_URL}/vacancies/${hhId}`);
    
    if (!response.ok) {
      throw new Error(`HH API error: ${response.status}`);
    }
    
    const data = await response.json();
    return parseHhVacancy(data);
  } catch (error) {
    console.error(`Failed to fetch vacancy ${hhId}:`, error);
    throw error;
  }
};

const parseHhVacancy = (item: any): Vacancy => {
  return {
    id: `hh-${item.id}`,
    hhId: item.id,
    title: item.name,
    company: item.employer?.name || 'Неизвестно',
    companyId: item.employer?.id || '',
    url: item.alternate_url,
    location: item.area?.name,
    salary: item.salary,
    description: item.description || '',
    skills: item.skills ? Object.keys(item.skills) : [],
    requirements: [],
    responsibilities: [],
    experience: item.experience?.name,
    employment: item.employment?.name,
    schedule: item.schedule?.name,
    source: 'hh.ru',
    publishedAt: item.published_at,
    normalizedAt: new Date().toISOString(),
  };
};
