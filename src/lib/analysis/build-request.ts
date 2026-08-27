import { buildSystemPrompt } from "@/config/analyzer-prompt";
import { compactMarketData, type VacancyMarketData } from "@/lib/ats/market-data";
import { fileToBase64 } from "@/lib/files/file-to-base64";
import { responseFormat } from "@/lib/polza/response-format";
import { formatCurrentDate } from "@/lib/resume/experience-dates";
import type { CompletionRequest } from "@/lib/polza/types";

export const buildResumeAnalysisRequest = async (
  file: File,
  model: string,
  market: VacancyMarketData,
  currentDate: Date,
): Promise<CompletionRequest> => {
  const base64Pdf = await fileToBase64(file);
  const userText = `Проанализируй приложенное резюме.\n\nVACANCY_MARKET_DATA:\n${JSON.stringify(compactMarketData(market))}`;

  return {
    model,
    messages: [
      { role: "system", content: buildSystemPrompt(formatCurrentDate(currentDate)) },
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
  };
};

export const buildRepairRequest = (
  model: string,
  invalidResponse: string,
  validationIssues: string[],
): CompletionRequest => ({
  model,
  messages: [
    {
      role: "system",
      content:
        "Исправь только JSON-структуру по переданной schema. Не добавляй новые факты. Для отсутствующей информации используй null/unknown/пустой массив. Верни только JSON.",
    },
    {
      role: "user",
      content: `INVALID_RESPONSE:\n${invalidResponse}\n\nVALIDATION_ERRORS:\n${validationIssues.join("\n")}`,
    },
  ],
  response_format: responseFormat(model),
  temperature: 0,
});
