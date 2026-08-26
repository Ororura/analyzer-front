import type { responseFormat } from "./response-format";

export interface PolzaApiResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: { role: string; content: string };
    finish_reason: string;
  }>;
  usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
  system_fingerprint?: string;
}

export interface CompletionRequest {
  model: string;
  messages: unknown[];
  response_format: ReturnType<typeof responseFormat>;
  temperature: number;
  plugins?: unknown[];
}
