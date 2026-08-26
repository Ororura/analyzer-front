import { SYSTEM_PROMPT } from "@/config/analyzer-prompt";
import { ResumeModelResponseSchema } from "@/lib/analysis/schema";
import { finalizeAtsAnalysis } from "@/lib/ats/scorer";
import { compactMarketData, type VacancyMarketData } from "@/lib/ats/market-data";
import { providerForModel, toProviderResponseSchema } from "@/lib/polza/response-schema";
import type { ResumeAnalysisResult } from "@/types/ats";
import type { PolzaApiResponse } from "@/types";

const API_BASE_URL = "https://polza.ai/api/v1";
export class PolzaApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "PolzaApiError";
  }
}

export class AnalysisResponseError extends Error {
  constructor(
    message: string,
    readonly issues: string[],
  ) {
    super(message);
    this.name = "AnalysisResponseError";
  }
}

export const analyzeResume = async (
  file: File,
  apiKey: string,
  model: string,
  market: VacancyMarketData,
): Promise<ResumeAnalysisResult> => {
  const base64Pdf = await fileToBase64(file);
  const userText = `Проанализируй приложенное резюме.\n\nVACANCY_MARKET_DATA:\n${JSON.stringify(compactMarketData(market))}`;
  const initial = await requestCompletion(apiKey, {
    model,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: [
          { type: "text", text: userText },
          { type: "file", file: { filename: file.name, file_data: `data:application/pdf;base64,${base64Pdf}` } },
        ],
      },
    ],
    plugins: [{ id: "file-parser", pdf: { engine: "mistral-ocr" } }],
    response_format: responseFormat(model),
    temperature: 0.1,
  });

  const parsed = parseModelResponse(initial);
  if (parsed.success) return finalizeResponse(parsed.data, market);

  const repaired = await requestCompletion(apiKey, {
    model,
    messages: [
      {
        role: "system",
        content:
          "Исправь только JSON-структуру по переданной schema. Не добавляй новые факты. Для отсутствующей информации используй null/unknown/пустой массив. Верни только JSON.",
      },
      {
        role: "user",
        content: `INVALID_RESPONSE:\n${initial}\n\nVALIDATION_ERRORS:\n${parsed.issues.join("\n")}`,
      },
    ],
    response_format: responseFormat(model),
    temperature: 0,
  });
  const repairedParsed = parseModelResponse(repaired);
  if (!repairedParsed.success) {
    throw new AnalysisResponseError("AI вернул невалидный JSON после одной попытки исправления", repairedParsed.issues);
  }
  return finalizeResponse(repairedParsed.data, market);
};

const finalizeResponse = (
  response: typeof ResumeModelResponseSchema._output,
  market: VacancyMarketData,
): ResumeAnalysisResult => ({
  basicAnalysis: response.basicAnalysis,
  atsAnalysis: finalizeAtsAnalysis(response.atsAnalysis, market),
});

type ParseResult =
  { success: true; data: typeof ResumeModelResponseSchema._output } | { success: false; issues: string[] };

export const parseModelResponse = (content: string): ParseResult => {
  const json = extractJsonObject(content);
  if (!json) return { success: false, issues: ["В ответе не найден JSON-объект"] };
  let value: unknown;
  try {
    value = JSON.parse(json);
  } catch (error) {
    return { success: false, issues: [error instanceof Error ? error.message : "Невалидный JSON"] };
  }
  const parsed = ResumeModelResponseSchema.safeParse(value);
  if (parsed.success) return { success: true, data: parsed.data };
  return {
    success: false,
    issues: parsed.error.issues.map((issue) => `${issue.path.join(".") || "root"}: ${issue.message}`),
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

interface CompletionRequest {
  model: string;
  messages: unknown[];
  response_format: ReturnType<typeof responseFormat>;
  temperature: number;
  plugins?: unknown[];
}

const responseFormat = (model: string) => ({
  type: "json_schema" as const,
  json_schema: {
    name: "resume_analysis",
    strict: true,
    schema: toProviderResponseSchema(ResumeModelResponseSchema, providerForModel(model)),
  },
});

const requestCompletion = async (apiKey: string, body: CompletionRequest): Promise<string> => {
  const response = await fetch(`${API_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const payload = (await response.json().catch(() => null)) as
    PolzaApiResponse | { error?: { message?: string } } | null;
  if (!response.ok) {
    const message = payload && "error" in payload ? payload.error?.message : undefined;
    throw new PolzaApiError(message || "Polza AI вернул ошибку", response.status);
  }
  const content = payload && "choices" in payload ? payload.choices[0]?.message.content : undefined;
  if (!content) throw new PolzaApiError("AI вернул пустой результат анализа", response.status);
  return content;
};

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string" || !result.includes(",")) return reject(new Error("Не удалось прочитать PDF"));
      resolve(result.slice(result.indexOf(",") + 1));
    };
    reader.onerror = () => reject(reader.error ?? new Error("Не удалось прочитать PDF"));
    reader.readAsDataURL(file);
  });
