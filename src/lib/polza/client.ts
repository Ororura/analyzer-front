import type { CompletionRequest, PolzaApiResponse } from "./types";
import { PolzaApiError } from "./errors";

const API_BASE_URL = "https://polza.ai/api/v1";

export const requestCompletion = async (apiKey: string, body: CompletionRequest): Promise<string> => {
  const response = await fetch(`${API_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const payload = (await response.json().catch(() => null)) as
    | PolzaApiResponse
    | { error?: { message?: string } }
    | null;
  if (!response.ok) {
    const message = payload && "error" in payload ? payload.error?.message : undefined;
    throw new PolzaApiError(message || "Polza AI вернул ошибку", response.status);
  }
  const content = payload && "choices" in payload ? payload.choices[0]?.message.content : undefined;
  if (typeof content !== "string" || content.trim() === "") {
    throw new PolzaApiError("AI response does not contain message.content", response.status);
  }
  return content;
};
