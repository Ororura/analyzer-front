import type { AtsResult, AtsScoreBreakdown, SkillMatch } from '@/types/ats';

export const extractResumeStructure = (text: string): any => {
  const lines = text.split('\n');
  const skills: string[] = [];
  const experience: any[] = [];
  
  let currentSection = '';
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    
    const lower = trimmed.toLowerCase();
    
    if (lower.includes('навыки') || lower.includes('skills')) {
      currentSection = 'skills';
      continue;
    }
    
    if (lower.includes('опыт') || lower.includes('experience')) {
      currentSection = 'experience';
      continue;
    }
    
    if (currentSection === 'skills' && !trimmed.startsWith('#')) {
      const skill = trimmed.replace(/^[•\-\*\d.\)]+\s*/, '').split(',')[0].trim();
      if (skill.length > 1 && skill.length < 50) {
        skills.push(skill);
      }
    }
    
    if (currentSection === 'experience') {
      const match = trimmed.match(/([А-ЯA-Z][а-яa-z]+(?:\s+[А-ЯA-Z][а-яa-z]+)+)\s+\d{4} —/);
      if (match) {
        experience.push({
          title: match[1],
          company: trimmed,
          period: trimmed.match(/\d{4} — \d{4}/)?.[0] || '',
        });
      }
    }
  }
  
  return { text, skills, experience };
};

export const calculateKeywordMatch = (resumeText: string, requirements: string[], responsibilities: string[]): number => {
  const allRequirements = [...requirements, ...responsibilities];
  if (allRequirements.length === 0) return 100;
  
  let found = 0;
  let missing = 0;
  
  for (const req of allRequirements) {
    const normalizedReq = req.toLowerCase();
    const normalizedText = resumeText.toLowerCase();
    
    const keywords = normalizedReq.split(/\s+/).filter(k => k.length > 2);
    const matches = keywords.filter(k => normalizedText.includes(k));
    
    if (matches.length >= keywords.length * 0.5) {
      found++;
    } else {
      missing++;
    }
  }
  
  if (found + missing === 0) return 100;
  
  return Math.round((found / (found + missing)) * 100);
};

export const calculateTechnicalMatch = (resumeSkills: string[], vacancySkills: string[]): number => {
  if (vacancySkills.length === 0) return 100;
  
  let found = 0;
  let partial = 0;
  let missing = 0;
  
  for (const vacancySkill of vacancySkills) {
    const normalizedVacancy = vacancySkill.toLowerCase();
    const matched = resumeSkills.some(resumeSkill => {
      const normalizedResume = resumeSkill.toLowerCase();
      return normalizedResume === normalizedVacancy || 
             normalizedResume.includes(normalizedVacancy) || 
             normalizedVacancy.includes(normalizedResume);
    });
    
    if (matched) {
      found++;
    } else if (resumeSkills.some(skill => skill.toLowerCase().includes(normalizedVacancy.substring(0, 3)))) {
      partial++;
    } else {
      missing++;
    }
  }
  
  if (found + partial + missing === 0) return 100;
  
  const weightedScore = (found * 100 + partial * 50) / (found + partial + missing);
  return Math.round(weightedScore);
};

export const calculateExperienceMatch = (resumeText: string, requiredExperience?: string): number => {
  if (!requiredExperience) return 100;
  
  const yearsMatch = requiredExperience.match(/(\d+)\+? лет?/);
  if (yearsMatch) {
    const requiredYears = parseInt(yearsMatch[1], 10);
    const resumeYears = extractExperienceYears(resumeText);
    
    if (resumeYears === undefined) return 75;
    
    if (resumeYears >= requiredYears) return 100;
    if (resumeYears >= requiredYears - 1) return 80;
    if (resumeYears >= requiredYears - 2) return 60;
    return 40;
  }
  
  if (requiredExperience.toLowerCase().includes('без опыта')) {
    return 100;
  }
  
  return 75;
};

export const calculateResponsibilitiesMatch = (resumeText: string, responsibilities: string[]): number => {
  if (responsibilities.length === 0) return 100;
  
  let found = 0;
  
  for (const responsibility of responsibilities) {
    const normalizedRes = responsibility.toLowerCase();
    const normalizedText = resumeText.toLowerCase();
    
    const keywords = normalizedRes.split(/\s+/).filter(k => k.length > 2);
    const matches = keywords.filter(k => normalizedText.includes(k));
    
    if (matches.length >= keywords.length * 0.5) {
      found++;
    }
  }
  
  return Math.round((found / responsibilities.length) * 100);
};

export const calculateStructureScore = (resumeText: string): number => {
  const sections = [
    { name: 'Опыт работы', pattern: /опыт работы/i },
    { name: 'Образование', pattern: /образование/i },
    { name: 'Навыки', pattern: /навыки/i },
    { name: 'Контакты', pattern: /contact|email/i },
  ];
  
  let found = 0;
  for (const section of sections) {
    if (section.pattern.test(resumeText)) {
      found++;
    }
  }
  
  return Math.round((found / sections.length) * 100);
};

export const calculateSemanticMatch = (
  resumeSkills: string[],
  vacancySkills: string[],
  _vacancyTitle: string
): number => {
  const normalizedResume = resumeSkills.map(s => s.toLowerCase());
  const normalizedVacancy = vacancySkills.map(s => s.toLowerCase());
  
  if (normalizedVacancy.length === 0) return 100;
  
  const skillMatches = normalizedResume.filter(skill => 
    normalizedVacancy.some(vacSkill => 
      skill === vacSkill || skill.includes(vacSkill) || vacSkill.includes(skill)
    )
  );
  
  return Math.round((skillMatches.length / normalizedVacancy.length) * 100);
};

export const calculateMatchResult = (
  resumeText: string,
  vacancy: any,
  resumeSkills: string[]
): any => {
  const normalizedVacancySkills = vacancy.skills.map((s: string) => s.toLowerCase());
  const normalizedResumeSkills = resumeSkills.map(s => s.toLowerCase());
  
  const keywordMatch = calculateKeywordMatch(resumeText, vacancy.requirements, vacancy.responsibilities);
  const technicalMatch = calculateTechnicalMatch(normalizedResumeSkills, normalizedVacancySkills);
  const experienceMatch = calculateExperienceMatch(resumeText, vacancy.experience);
  const responsibilitiesMatch = calculateResponsibilitiesMatch(resumeText, vacancy.responsibilities);
  const structureScore = calculateStructureScore(resumeText);
  const semanticMatch = calculateSemanticMatch(normalizedResumeSkills, normalizedVacancySkills, vacancy.title);
  
  const overallScore = 
    keywordMatch * 0.30 +
    technicalMatch * 0.25 +
    experienceMatch * 0.20 +
    responsibilitiesMatch * 0.10 +
    structureScore * 0.10 +
    semanticMatch * 0.05;
  
  const skillsMatch = createSkillMatches(normalizedResumeSkills, normalizedVacancySkills);
  
  return {
    score: Math.round(overallScore),
    breakdown: {
      keywordMatch: Math.round(keywordMatch),
      technicalMatch: Math.round(technicalMatch),
      experienceMatch: Math.round(experienceMatch),
      responsibilities: Math.round(responsibilitiesMatch),
      structure: Math.round(structureScore),
      semanticMatch: Math.round(semanticMatch),
    },
    skillsMatch,
  };
};

const createSkillMatches = (resumeSkills: string[], vacancySkills: string[]): SkillMatch[] => {
  const allSkills = [...new Set([...resumeSkills, ...vacancySkills])];
  
  return allSkills.map(skill => {
    const normalized = skill.toLowerCase();
    const foundInResume = resumeSkills.some(s => s.toLowerCase() === normalized);
    const foundInVacancy = vacancySkills.some(s => s.toLowerCase() === normalized);
    
    return {
      skill: skill.charAt(0).toUpperCase() + skill.slice(1),
      normalizedSkill: skill,
      foundInResume,
      foundInVacancy,
      importance: foundInVacancy ? 'required' : 'bonus',
      matchType: foundInResume && foundInVacancy ? 'exact' : foundInResume ? 'partial' : 'none',
    };
  });
};

const extractExperienceYears = (text: string): number | undefined => {
  const patterns = [
    /(\d+)\+? лет? опыта/i,
    /(\d+)\+? years? of experience/i,
    /(\d+)\+? лет? коммерческого опыта/i,
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return parseInt(match[1], 10);
    }
  }
  
  return undefined;
};

export const analyzeResumeDeterministic = async (
  resumeText: string,
  vacancies: any[]
): Promise<AtsResult> => {
  const skills: string[] = [];
  
  const vacancyResults = await Promise.all(
    vacancies.map(async (vacancy) => {
      const result = calculateMatchResult(resumeText, vacancy, skills);
      return {
        vacancy,
        matchResult: result,
      };
    })
  );
  
  const overallScore = Math.round(
    vacancyResults.reduce((sum, { matchResult }) => sum + matchResult.score, 0) / vacancyResults.length
  );
  
  const breakdown = calculateAverageBreakdown(vacancyResults.map(v => v.matchResult.breakdown));
  
  const allSkillsMatch = vacancyResults.flatMap(v => v.matchResult.skillsMatch);
  const uniqueSkillsMatch = mergeSkillMatches(allSkillsMatch);
  
  const vacancyMatches = vacancyResults.map(({ vacancy, matchResult }) => ({
    vacancyId: vacancy.id,
    vacancyTitle: vacancy.title,
    company: vacancy.company,
    score: matchResult.score,
    scoreBreakdown: matchResult.breakdown,
    skillsMatch: matchResult.skillsMatch,
    matchLevel: getMatchLevel(matchResult.score) as 'perfect' | 'good' | 'partial' | 'low',
  }));
  
  vacancyMatches.sort((a, b) => b.score - a.score);
  
  return {
    overallScore,
    breakdown,
    skillsMatch: uniqueSkillsMatch,
    keywordsFound: [],
    keywordsMissing: [],
    vacancyMatches: vacancyMatches.slice(0, 10),
    marketInsights: [],
    recommendations: [],
    marketStatistics: {
      totalVacancies: vacancies.length,
      analyzedAt: new Date().toISOString(),
      topSkills: [],
      experienceRequirements: {},
      employmentTypes: {},
      scheduleTypes: {},
      salaryRanges: {},
    },
  };
};

const getMatchLevel = (score: number): 'perfect' | 'good' | 'partial' | 'low' => {
  if (score >= 85) return 'perfect';
  if (score >= 70) return 'good';
  if (score >= 50) return 'partial';
  return 'low';
};

const calculateAverageBreakdown = (breakdowns: AtsScoreBreakdown[]): AtsScoreBreakdown => {
  if (breakdowns.length === 0) {
    return {
      keywordMatch: 0,
      technicalMatch: 0,
      experienceMatch: 0,
      responsibilities: 0,
      structure: 0,
      semanticMatch: 0,
    };
  }
  
  return {
    keywordMatch: Math.round(breakdowns.reduce((sum, b) => sum + b.keywordMatch, 0) / breakdowns.length),
    technicalMatch: Math.round(breakdowns.reduce((sum, b) => sum + b.technicalMatch, 0) / breakdowns.length),
    experienceMatch: Math.round(breakdowns.reduce((sum, b) => sum + b.experienceMatch, 0) / breakdowns.length),
    responsibilities: Math.round(breakdowns.reduce((sum, b) => sum + b.responsibilities, 0) / breakdowns.length),
    structure: Math.round(breakdowns.reduce((sum, b) => sum + b.structure, 0) / breakdowns.length),
    semanticMatch: Math.round(breakdowns.reduce((sum, b) => sum + b.semanticMatch, 0) / breakdowns.length),
  };
};

const mergeSkillMatches = (skillMatches: SkillMatch[]): SkillMatch[] => {
  const merged: Record<string, SkillMatch> = {};
  
  for (const match of skillMatches) {
    if (!merged[match.skill]) {
      merged[match.skill] = { ...match };
    } else {
      merged[match.skill].foundInResume = merged[match.skill].foundInResume || match.foundInResume;
      merged[match.skill].foundInVacancy = merged[match.skill].foundInVacancy || match.foundInVacancy;
    }
  }
  
  return Object.values(merged);
};
