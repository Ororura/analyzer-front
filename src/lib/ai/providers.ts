import type { AiProviderType } from '@/types/resume-analysis';

export const AI_PROVIDER_LABELS: Record<AiProviderType, string> = {
  POLZA: 'Polza AI',
  CODEX_CLI: 'Codex CLI',
};

export const getAiProviderLabel = (provider: AiProviderType): string => AI_PROVIDER_LABELS[provider];
