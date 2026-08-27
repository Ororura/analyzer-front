import ky, { isHTTPError } from "ky";
import { PolzaApiResponseSchema, PolzaErrorResponseSchema } from "./schema";
import type { CompletionRequest } from "./types";
import { PolzaApiError } from "./errors";

const API_BASE_URL = "https://polza.ai/api/v1";

const polzaClient = ky.create({
  prefix: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: false,
});

export const requestCompletion = async (apiKey: string, request: CompletionRequest): Promise<string> => {
  let response: Response;
  try {
    response = await polzaClient.post("chat/completions", {
      headers: { Authorization: `Bearer ${apiKey}` },
      json: request,
    });
  } catch (error) {
    if (isHTTPError(error)) {
      const errorPayload = PolzaErrorResponseSchema.safeParse(error.data);
      throw new PolzaApiError(
        errorPayload.success ? errorPayload.data.error.message : "Polza AI вернул ошибку",
        error.response.status,
      );
    }
    throw error;
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new PolzaApiError("Polza AI вернул некорректный ответ", response.status);
  }

  const validationResult = PolzaApiResponseSchema.safeParse(payload);
  const content = validationResult.success ? validationResult.data.choices[0]?.message.content : undefined;
  if (!content) {
    throw new PolzaApiError("AI response does not contain message.content", response.status);
  }
  return content;
};
