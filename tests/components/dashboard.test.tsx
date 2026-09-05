import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import {
  getChartSkills,
  getCodeExcerpt,
  getDashboardSkills,
  normalizePercent,
  safeExternalUrl,
} from '@/lib/dashboard-data';
import { MarkdownContent } from '@/components/result/MarkdownContent';
import { ResumeScoreCard } from '@/components/result/OverviewCards';
import { SkillMarketChart, SkillComparisonTable } from '@/components/result/SkillMarketChart';
import { structuredResumeAnalysisResult } from '../fixtures/resume-analysis';

const markdown = `# Анализ резюме
## Рекомендации
### Опыт
Текст с **результатами**, *метриками* и \`PostgreSQL\`.
- Пункт
1. Шаг
- [ ] Добавить метрики
- [x] Добавить стек
> Совет: опишите результат.

| Навык | Доля вакансий |
| --- | ---: |
| Java | 85% |

---
[Документация](https://spring.io)
[Небезопасная ссылка](javascript:alert(1))
<script>alert('xss')</script>
<img src=x onerror=alert(1)>

\`\`\`java
@GetMapping("/health")
public String health() { return "OK"; }
\`\`\`

\`\`\`unknown-language
<text>not executable</text>
\`\`\`
`;

describe('dashboard data', () => {
  it('normalizes frequencies without turning missing values into zero', () => {
    expect([null, undefined, NaN, Infinity].map(normalizePercent)).toEqual([null, null, null, null]);
    expect([0, 0.27, 1, 55, 140].map(normalizePercent)).toEqual([0, 27, 100, 55, 100]);
  });
  it('deduplicates skills, uses marketFrequency and never treats confidence as skill level', () => {
    const skills = getDashboardSkills(structuredResumeAnalysisResult);
    expect(skills.filter((skill) => skill.id === 'java')).toHaveLength(1);
    expect(skills.find((skill) => skill.id === 'java')).toMatchObject({ frequency: null, status: 'STRONG' });
    expect(skills.find((skill) => skill.id === 'testcontainers')).toMatchObject({ frequency: 27, status: 'NOT_FOUND' });
    expect(getChartSkills(skills).map((skill) => skill.frequency)).toEqual([27]);
  });
  it('limits the chart to six most frequent requirements and retains zero', () => {
    const skills = Array.from({ length: 8 }, (_, i) => ({
      id: String(i),
      name: String(i),
      status: null,
      frequency: i * 10,
    }));
    expect(getChartSkills(skills).map((skill) => skill.frequency)).toEqual([70, 60, 50, 40, 30, 20]);
    expect(getChartSkills(skills.slice(0, 1))[0].frequency).toBe(0);
  });
  it('extracts actual fenced code, including nested blocks, without rendering HTML', () => {
    expect(getCodeExcerpt(markdown)).toMatchObject({
      language: 'java',
      content: expect.stringContaining('@GetMapping'),
    });
    expect(getCodeExcerpt('> ```ts\n> const value = 1;\n> ```')).toEqual({
      language: 'ts',
      content: 'const value = 1;',
    });
    expect(getCodeExcerpt('Only text')).toBeNull();
  });
  it('allows only web URLs for vacancy links', () => {
    expect(safeExternalUrl('javascript:alert(1)')).toBeUndefined();
    expect(safeExternalUrl('https://example.com/job')).toBe('https://example.com/job');
  });
});

describe('dashboard rendering', () => {
  it('escapes raw HTML and supports GFM and real syntax highlighting', () => {
    const html = renderToStaticMarkup(<MarkdownContent content={markdown} />);
    expect(html).toContain('&lt;script&gt;');
    expect(html).not.toContain('<script>');
    expect(html).not.toContain('href="javascript:');
    expect(html).not.toContain('<img src="x"');
    expect(html).toContain('markdown-table-scroll');
    expect(html).toContain('type="checkbox"');
    expect(html).toContain('disabled');
    expect(html).toContain('hljs-keyword');
    expect(html).toContain('hljs-string');
    expect(html).toContain('Скопировать код: java');
    expect(html).toContain('unknown-language');
    expect(html).toContain('<blockquote>');
  });
  it('does not inflate a score of one to 100', () => {
    const html = renderToStaticMarkup(
      <ResumeScoreCard result={{ ...structuredResumeAnalysisResult, overallScore: 1 }} />,
    );
    expect(html).toContain('stroke-dasharray="1 100"');
    expect(html).toContain('Общая оценка: 1 из 100');
  });
  it('exposes market values and statuses in accessible chart text', () => {
    const skills = getDashboardSkills(structuredResumeAnalysisResult);
    const html = renderToStaticMarkup(<SkillMarketChart skills={skills} />);
    expect(html).toContain('<caption>');
    expect(html).toContain('27% вакансий');
    expect(html).not.toContain('91%');
    const table = renderToStaticMarkup(<SkillComparisonTable skills={skills} />);
    expect(table).toContain('Нет данных');
    expect(table).toContain('Сильное подтверждение');
  });
  it('renders an informative empty chart', () => {
    const html = renderToStaticMarkup(<SkillMarketChart skills={[]} />);
    expect(html).toContain('Нет данных о частоте требований');
    expect(html).not.toContain('market-bar');
  });
});
