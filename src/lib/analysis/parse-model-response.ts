import { AiResumeAnalysisResponseSchema, type AiResumeAnalysisResponse } from "./schema";
import { reportValidationIssues } from "./validation";

export type ParseModelResponseResult =
  | { success: true; data: AiResumeAnalysisResponse }
  | { success: false; issues: string[] };

export const parseModelResponse = (content: string): ParseModelResponseResult => {
  const json = extractJsonObject(content);
  if (!json) return { success: false, issues: ["В ответе не найден JSON-объект"] };

  let value: unknown;
  try {
    value = JSON.parse(json);
  } catch (error) {
    return { success: false, issues: [error instanceof Error ? error.message : "Невалидный JSON"] };
  }

  const validationResult = AiResumeAnalysisResponseSchema.safeParse(value);
  if (validationResult.success) return { success: true, data: validationResult.data };

  return {
    success: false,
    issues: reportValidationIssues("Resume AI response validation failed", validationResult.error.issues),
  };
};

export const extractJsonObject = (content: string): string | null => {
  const start = content.indexOf("{");
  if (start < 0) return null;

  let depth = 0;
  let quoted = false;
  let escaped = false;
  for (let index = start; index < content.length; index++) {
    const character = content[index];
    if (quoted) {
      if (escaped) escaped = false;
      else if (character === "\\") escaped = true;
      else if (character === '"') quoted = false;
      continue;
    }
    if (character === '"') quoted = true;
    else if (character === "{") depth++;
    else if (character === "}" && --depth === 0) return content.slice(start, index + 1);
  }
  return null;
};
