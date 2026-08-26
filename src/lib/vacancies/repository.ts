import type { Vacancy } from '@/types/vacancy';

const CACHE_KEY = 'ats-vacancies-cache';
const CACHE_TTL = 6 * 60 * 60 * 1000;

export interface VacancyCache {
  data: Vacancy[];
  timestamp: number;
  filters?: Record<string, unknown>;
}

export const saveVacanciesToCache = (vacancies: Vacancy[], filters?: Record<string, unknown>): void => {
  try {
    const cache: VacancyCache = {
      data: vacancies,
      timestamp: Date.now(),
      filters,
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch (error) {
    console.error('Failed to save vacancies to cache:', error);
  }
};

export const getVacanciesFromCache = (filters?: Record<string, unknown>): Vacancy[] | null => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;
    
    const { data, timestamp, filters: cachedFilters } = JSON.parse(cached);
    const now = Date.now();
    
    if (now - timestamp > CACHE_TTL) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
    
    if (filters && cachedFilters) {
      const filtersMatch = Object.entries(filters).every(([key, value]) => {
        return JSON.stringify(cachedFilters[key]) === JSON.stringify(value);
      });
      
      if (!filtersMatch) {
        return null;
      }
    }
    
    return data;
  } catch (error) {
    console.error('Failed to get vacancies from cache:', error);
    localStorage.removeItem(CACHE_KEY);
    return null;
  }
};

export const clearVacancyCache = (): void => {
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch (error) {
    console.error('Failed to clear vacancy cache:', error);
  }
};

export const invalidateVacancyCache = (): void => {
  clearVacancyCache();
};
