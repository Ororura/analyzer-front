import { describe, expect, it } from 'vitest';
import { parseMarkdownResponse } from '@/lib/utils/helpers';

describe('parseMarkdownResponse', () => {
  it('parses an inline final score from the AI response', () => {
    const result = parseMarkdownResponse('**Итоговая оценка резюме: 8.5/10**');

    expect(result.overallScore).toBe(8.5);
    expect(result.overallScoreError).toBeUndefined();
  });

  it('parses a score on the line after its heading', () => {
    const result = parseMarkdownResponse('## Итоговая оценка резюме:\n7/10');

    expect(result.overallScore).toBe(7);
    expect(result.overallScoreError).toBeUndefined();
  });

  it('reports missing and invalid scores explicitly', () => {
    expect(parseMarkdownResponse('# Анализ').overallScoreError).toBe('missing');
    expect(parseMarkdownResponse('Итоговая оценка резюме: 12/10').overallScoreError).toBe('invalid');
    expect(parseMarkdownResponse('Итоговая оценка резюме: высокая').overallScoreError).toBe('invalid');
  });
});
