# ATS Analysis Module

## Architecture

```
src/lib/
├── vacancies/       # Vacancy data fetching and processing
│   ├── client.ts    # hh.ru API client
│   ├── normalizer.ts  # Skill normalization (Spring Boot, postgres, etc.)
│   └── repository.ts  # Caching layer
│
├── market/          # Market analysis
│   └── analyzer.ts  # Market statistics calculation
│
├── ats/             # ATS engine
│   └── scorer.ts    # Deterministic ATS score calculation
│
├── prompt/          # LLM prompts
│   ├── templates.ts   # Prompt templates
│   └── index.ts       # Export
│
└── polza/           # Polza AI integration
    ├── client.ts      # API client with ATS analysis
    └── index.ts       # Export
```

## Key Features

### 1. Vacancy Fetching
- Fetches vacancies from hh.ru API
- Caches results for 6 hours
- Normalizes skills (Spring Boot, PostgreSQL, etc.)

### 2. ATS Score Calculation (Deterministic)
```
ATS Score =
  - Keyword Match:        30%
  - Technical Match:      25%
  - Experience Match:     20%
  - Responsibilities:     10%
  - Resume Structure:     10%
  - Semantic Match:        5%
```

### 3. Market Analysis
- Analyzes top skills frequency
- Classifies demand (high/medium/low)
- Generates recommendations

### 4. Skill Normalization
Normalizes technology names:
- `springboot` → `Spring Boot`
- `postgres` → `PostgreSQL`
- `java 17` → `Java`

## Usage

```typescript
import { analyzeResume } from '@/lib/polza/client';

// Analyze resume with ATS
const result = await analyzeResume(file, apiKey, model);

// ATS result structure:
{
  overallScore: number;        // 0-100
  breakdown: {
    keywordMatch: number;
    technicalMatch: number;
    experienceMatch: number;
    responsibilities: number;
    structure: number;
    semanticMatch: number;
  };
  skillsMatch: SkillMatch[];
  keywordsFound: string[];
  keywordsMissing: string[];
  vacancyMatches: VacancyMatch[];
  marketInsights: MarketInsight[];
  recommendations: Recommendation[];
  marketStatistics: MarketStatistics;
}
```

## Security

- Input sanitization for prompt injection
- No hallucinations - never recommend skills without proof
- PDF file size limit: 50 MB
- Only PDF MIME type accepted

## Performance

- Deterministic analysis first (fast)
- Top 10 vacancies selected for LLM analysis
- Vacancy caching (6h TTL)
- Minimal API calls

## Testing

Run tests for specific modules:
```bash
# Add test files in tests/
```
