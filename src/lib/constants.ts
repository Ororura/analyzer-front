export const DEFAULT_MODEL = 'openai/gpt-5.2';

export const RECOMMENDED_MODELS = [
  DEFAULT_MODEL,
  'openai/gpt-4.5',
  'openai/gpt-4o',
  'anthropic/claude-sonnet-4',
  'anthropic/claude-3.5-sonnet',
  'google/gemini-2.5-pro',
];

export const PDF_MIME_TYPE = 'application/pdf';
export const MAX_FILE_SIZE = 50 * 1024 * 1024;

export const API_BASE_URL = 'https://polza.ai/api/v1/chat/completions';
