import type { VacancyMarketData } from "@/lib/ats/market-data";
import { requestCompletion } from "@/lib/polza/client";
import { AnalysisResponseError } from "@/lib/polza/errors";
import type { ResumeAnalysisResult } from "./schema";
import { buildRepairRequest, buildResumeAnalysisRequest } from "./build-request";
import { finalizeResponse } from "./finalize-response";
import { parseModelResponse } from "./parse-model-response";

export const analyzeResume = async (
  file: File,
  apiKey: string,
  model: string,
  market: VacancyMarketData,
): Promise<ResumeAnalysisResult> => {
  const request = await buildResumeAnalysisRequest(file, model, market);
  const initialResponse = await requestCompletion(apiKey, request);
  const initialParseResult = parseModelResponse(initialResponse);

  if (initialParseResult.success) return finalizeResponse(initialParseResult.data, market);

  const repairedResponse = await requestCompletion(
    apiKey,
    buildRepairRequest(model, initialResponse, initialParseResult.issues),
  );
  const repairedParseResult = parseModelResponse(repairedResponse);

  if (!repairedParseResult.success) {
    throw new AnalysisResponseError("Не удалось обработать результат анализа", repairedParseResult.issues);
  }

  return finalizeResponse(repairedParseResult.data, market);
};
