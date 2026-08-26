import type { MarketInsight, MarketStatistics } from '@/types/ats';
import { normalizeSkill } from '@/lib/vacancies/normalizer';

export const analyzeMarket = (vacancies: any[]): MarketStatistics => {
  const skillCounts: Record<string, number> = {};
  const experienceCounts: Record<string, number> = {};
  const employmentCounts: Record<string, number> = {};
  const scheduleCounts: Record<string, number> = {};
  const salaryRanges: Record<string, number> = {};
  
  let total = 0;
  
  for (const vacancy of vacancies) {
    total++;
    
    for (const skill of vacancy.skills) {
      const normalized = normalizeSkill(skill);
      skillCounts[normalized] = (skillCounts[normalized] || 0) + 1;
    }
    
    if (vacancy.experience) {
      experienceCounts[vacancy.experience] = (experienceCounts[vacancy.experience] || 0) + 1;
    }
    
    if (vacancy.employment) {
      employmentCounts[vacancy.employment] = (employmentCounts[vacancy.employment] || 0) + 1;
    }
    
    if (vacancy.schedule) {
      scheduleCounts[vacancy.schedule] = (scheduleCounts[vacancy.schedule] || 0) + 1;
    }
    
    if (vacancy.salary) {
      const range = getSalaryRange(vacancy.salary);
      salaryRanges[range] = (salaryRanges[range] || 0) + 1;
    }
  }
  
  const skillFrequencies = Object.entries(skillCounts)
    .map(([skill, count]) => ({
      skill,
      normalizedSkill: normalizeSkill(skill),
      frequency: Math.round((count / total) * 100),
    }))
    .sort((a, b) => b.frequency - a.frequency);
  
  const topSkills = skillFrequencies.slice(0, 20).map((item): MarketInsight => ({
    skill: item.skill,
    normalizedSkill: item.normalizedSkill,
    frequency: item.frequency,
    demand: item.frequency > 70 ? 'high' : item.frequency > 40 ? 'medium' : 'low',
    recommendation: getSkillRecommendation(item.frequency),
  }));
  
  return {
    totalVacancies: total,
    analyzedAt: new Date().toISOString(),
    topSkills,
    experienceRequirements: experienceCounts,
    employmentTypes: employmentCounts,
    scheduleTypes: scheduleCounts,
    salaryRanges,
  };
};

export const getSkillRecommendation = (frequency: number): string => {
  if (frequency > 70) {
    return 'Критически важный навык — обязательно добавьте в резюме если есть опыт';
  } else if (frequency > 40) {
    return 'Желательный навык — рекомендуется иметь хотя бы базовое знакомство';
  } else if (frequency > 20) {
    return 'Бонусный навык — будет плюсом, но не обязательным';
  } else {
    return 'Нишевый навык — редко встречается, не приоритет';
  }
};

export const getSalaryRange = (salary: { from?: number; to?: number; currency: string }): string => {
  const { from, to, currency } = salary;
  
  if (from && to) {
    return `${from}-${to} ${currency}`;
  } else if (from) {
    return `from ${from} ${currency}`;
  } else if (to) {
    return `to ${to} ${currency}`;
  } else {
    return 'not specified';
  }
};

export const analyzeVacancyMatch = (
  _vacancy: any,
  score: number,
  breakdown: any
): {
  matchLevel: 'perfect' | 'good' | 'partial' | 'low';
  insights: MarketInsight[];
} => {
  let matchLevel: 'perfect' | 'good' | 'partial' | 'low';
  
  if (score >= 85) {
    matchLevel = 'perfect';
  } else if (score >= 70) {
    matchLevel = 'good';
  } else if (score >= 50) {
    matchLevel = 'partial';
  } else {
    matchLevel = 'low';
  }
  
  const insights: MarketInsight[] = [];
  
  if (breakdown.technicalMatch < 60) {
    insights.push({
      skill: 'Technical Skills',
      normalizedSkill: 'technical skills',
      frequency: 0,
      demand: 'high',
      recommendation: 'Низкое совпадение технических навыков — пересмотрите раздел навыков',
    });
  }
  
  if (breakdown.keywordMatch < 60) {
    insights.push({
      skill: 'Keywords',
      normalizedSkill: 'keywords',
      frequency: 0,
      demand: 'high',
      recommendation: 'Мало ключевых слов из вакансии — добавьте соответствующие термины',
    });
  }
  
  return { matchLevel, insights };
};

export const calculateMarketMatch = (vacancyMatches: { score: number }[]): number => {
  if (vacancyMatches.length === 0) return 0;
  
  const totalScore = vacancyMatches.reduce((sum, match) => sum + match.score, 0);
  return Math.round(totalScore / vacancyMatches.length);
};

export const getExperienceRecommendation = (required: string, resumeYears: number | undefined): string => {
  if (!required) return 'Опыт не указан';
  
  const yearsMatch = required.match(/(\d+)\+? лет?/);
  if (yearsMatch) {
    const requiredYears = parseInt(yearsMatch[1], 10);
    
    if (resumeYears === undefined) {
      return 'Опыт не указан в резюме — добавьте количество лет опыта';
    }
    
    if (resumeYears >= requiredYears) {
      return 'Опыт соответствует требованиям';
    }
    
    if (resumeYears >= requiredYears - 1) {
      return 'Опыт немного меньше требуемого — подчеркните другие сильные стороны';
    }
    
    return `Требуется ${requiredYears} лет опыта, у вас ${resumeYears} — рассмотрите возможность повышения квалификации`;
  }
  
  if (required.toLowerCase().includes('без опыта')) {
    return 'Вакансия для junior — подходит начинающим разработчикам';
  }
  
  return 'Опыт не указан — уточните требования у работодателя';
};

export const extractMarketInsights = (vacancies: any[]): MarketInsight[] => {
  const skillCounts: Record<string, number> = {};
  let total = 0;
  
  for (const vacancy of vacancies) {
    total++;
    for (const skill of vacancy.skills) {
      skillCounts[skill] = (skillCounts[skill] || 0) + 1;
    }
  }
  
  return Object.entries(skillCounts)
    .map(([skill, count]) => ({
      skill,
      normalizedSkill: normalizeSkill(skill),
      frequency: Math.round((count / total) * 100),
      demand: (count / total > 0.7 ? 'high' : count / total > 0.4 ? 'medium' : 'low') as 'high' | 'medium' | 'low',
      recommendation: getSkillRecommendation(Math.round((count / total) * 100)),
    }))
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, 20);
};
