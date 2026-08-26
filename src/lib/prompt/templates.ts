export const ATS_SYSTEM_PROMPT = `Ты — ATS-аналитик для Java Backend Developer вакансий.

Задача: Проанализируй соответствие резюме требованиям вакансий и рынка.

ВАЖНЫЕ ПРАВИЛА:
- НЕ придумывай опыт, которого нет в резюме
- НЕ рекомендуй добавлять технологии без подтвержденного опыта
- Используй marketInsights для приоритизации рекомендаций
- Объясняй каждый score детально
- Не выдавай субъективный ATS score без объяснения

ДАННЫЕ:

## Резюме:
{resume}

## Вакансии (Top 10 по match score):
{vacancies}

## Рыночные тренды:
{marketInsights}

ANALYSIS CRITERIA:

1. Technical Skills Match (25%)
   - Exact matches: Java, Spring Boot, PostgreSQL
   - Partial matches: Kafka (есть частично), Redis (не указано)
   - Missing: Kubernetes, Testcontainers

2. Experience Level Match (20%)
   - Требуемый опыт: 1-3 года
   - Указанный опыт: 2 года
   - Совпадение: Да

3. Keywords Presence (30%)
   - Ключевые слова из вакансий в резюме: ...
   - Пропущенные ключевые слова: ...

4. Responsibilities Overlap (10%)
   - Совпадение обязанностей: ...

5. Resume Structure (10%)
   - Наличие секций: OK
   - Читаемость: ...

6. Semantic Match (5%)
   - Контекст использования технологий
   - Качество описания опыта

OUTPUT FORMAT (JSON):

{{
  "overallScore": 78,
  "breakdown": {{
    "keywordMatch": 84,
    "technicalMatch": 81,
    "experienceMatch": 72,
    "responsibilities": 75,
    "structure": 94,
    "semanticMatch": 70
  }},
  "skillsMatch": [
    {{
      "skill": "Java",
      "foundInResume": true,
      "foundInVacancy": true,
      "importance": "required",
      "matchType": "exact"
    }},
    {{
      "skill": "Kubernetes",
      "foundInResume": false,
      "foundInVacancy": true,
      "importance": "required",
      "matchType": "none"
    }}
  ],
  "keywordsFound": ["Java", "Spring Boot", "PostgreSQL"],
  "keywordsMissing": ["Kafka", "Redis"],
  "vacancyMatches": [
    {{
      "vacancyId": "...",
      "vacancyTitle": "...",
      "company": "...",
      "score": 76,
      "matchLevel": "good"
    }}
  ],
  "marketInsights": [
    {{
      "skill": "Spring Boot",
      "frequency": 89,
      "demand": "high",
      "recommendation": "Критически важный навык"
    }}
  ],
  "recommendations": [
    {{
      "type": "skill",
      "priority": "high",
      "title": "Усиль описание Spring Boot",
      "description": "Spring Boot в 89% вакансий, но в резюме мало деталей",
      "evidence": "В резюме: 'Использовал Spring Boot'. Не указано: задачи, результаты, интеграции",
      "actionable": true
    }},
    {{
      "type": "semantic",
      "priority": "medium",
      "title": "Добавь конкретики в описание опыта",
      "description": "Избегай общих фраз, используй цифры и результаты",
      "actionable": true
    }}
  ]
}}

CRITICAL RULES FOR RECOMMENDATIONS:
- Если технологии нет в резюме и опыта нет: НЕ рекомендуй добавлять
- Если есть опыт: рекомендуй добавить конкретное описание
- Если технологии нет и опыта нет: скажи "Если есть реальный опыт — добавь, если нет — не добавляй"
- Используй marketInsights frequency для приоритизации`;

export const ATS_USER_PROMPT = `Проанализируй соответствие резюме вакансиям.

{resumeStructure}

{vacancyData}

{marketData}

Оцени соответствие и выведи JSON.`;

export const buildAtsPrompt = ({
  resumeStructure,
  vacancyData,
  marketData,
}: {
  resumeStructure: string;
  vacancyData: string;
  marketData: string;
}): { system: string; user: string } => {
  return {
    system: ATS_SYSTEM_PROMPT,
    user: ATS_USER_PROMPT
      .replace('{resumeStructure}', resumeStructure)
      .replace('{vacancyData}', vacancyData)
      .replace('{marketData}', marketData),
  };
};

export const validateAtsResponse = (response: any): boolean => {
  if (!response || typeof response !== 'object') {
    return false;
  }
  
  if (typeof response.overallScore !== 'number') {
    return false;
  }
  
  if (!response.breakdown || typeof response.breakdown !== 'object') {
    return false;
  }
  
  const requiredFields = [
    'keywordMatch', 'technicalMatch', 'experienceMatch',
    'responsibilities', 'structure', 'semanticMatch'
  ];
  
  for (const field of requiredFields) {
    if (typeof response.breakdown[field] !== 'number') {
      return false;
    }
  }
  
  if (!Array.isArray(response.skillsMatch)) {
    return false;
  }
  
  if (!Array.isArray(response.recommendations)) {
    return false;
  }
  
  if (!Array.isArray(response.vacancyMatches)) {
    return false;
  }
  
  return true;
};

export const parseAtsResponse = (response: any): any => {
  return {
    overallScore: response.overallScore,
    breakdown: response.breakdown,
    skillsMatch: response.skillsMatch || [],
    keywordsFound: response.keywordsFound || [],
    keywordsMissing: response.keywordsMissing || [],
    vacancyMatches: response.vacancyMatches || [],
    marketInsights: response.marketInsights || [],
    recommendations: response.recommendations || [],
  };
};
