import { marked } from 'marked';
import type { ResumeAnalysisResult, SkillEvidence } from '@/types/resume-analysis';

export interface DashboardSkill {
  id: string;
  name: string;
  status: SkillEvidence['status'] | null;
  frequency: number | null;
}

export function normalizePercent(value: number | null | undefined): number | null {
  if (value == null || !Number.isFinite(value)) return null;
  return Math.max(0, Math.min(100, Math.abs(value) <= 1 ? value * 100 : value));
}

export function getDashboardSkills(result: ResumeAnalysisResult): DashboardSkill[] {
  const skills: DashboardSkill[] = [];
  const key = (name: string) => name.trim().toLocaleLowerCase();
  const add = (skill: DashboardSkill) => {
    const existing = skills.find((item) => item.id === skill.id || key(item.name) === key(skill.name));
    if (existing) {
      existing.status ??= skill.status;
      existing.frequency ??= skill.frequency;
    } else skills.push(skill);
  };
  for (const skill of result.skillEvidence?.skills ?? [])
    add({ id: skill.skillId, name: skill.skill, status: skill.status, frequency: null });
  for (const gap of result.skillGaps?.gaps ?? [])
    add({
      id: gap.skillId,
      name: gap.skill,
      status: gap.candidateStatus,
      frequency: normalizePercent(gap.marketFrequency),
    });
  for (const [names, status] of [
    [result.skills.confirmed, 'STRONG'],
    [result.skills.weakEvidence, 'WEAK'],
    [result.skills.missing, 'NOT_FOUND'],
  ] as const) {
    for (const name of names) add({ id: key(name), name, status, frequency: null });
  }
  return skills;
}

export const getChartSkills = (skills: DashboardSkill[]) =>
  skills
    .filter((skill) => skill.frequency !== null)
    .sort((a, b) => (b.frequency ?? 0) - (a.frequency ?? 0))
    .slice(0, 6);

export function getCodeExcerpt(markdown: string): { language: string; content: string } | null {
  let excerpt: { language: string; content: string } | null = null;
  marked.walkTokens(marked.lexer(markdown), (token) => {
    if (!excerpt && token.type === 'code')
      excerpt = { language: token.lang?.split(/\s/)[0] ?? '', content: token.text };
  });
  return excerpt;
}

export function safeExternalUrl(value: string | undefined): string | undefined {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    return ['https:', 'http:'].includes(url.protocol) ? url.href : undefined;
  } catch {
    return undefined;
  }
}
