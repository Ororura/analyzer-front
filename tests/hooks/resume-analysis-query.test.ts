import { QueryClient } from "@tanstack/react-query";
import { afterEach, describe, expect, it, vi } from "vitest";
import { RawAtsAnalysisSchema } from "@/lib/analysis/schema";
import { createBaselineMarketData } from "@/lib/ats/market-data";
import { finalizeAtsAnalysis } from "@/lib/ats/scorer";
import { validModelResponse } from "../fixtures/analysis";

const { analyzeResumeMock, loadVacancyMarketMock } = vi.hoisted(() => ({
  analyzeResumeMock: vi.fn(),
  loadVacancyMarketMock: vi.fn(),
}));

vi.mock("@/lib/analysis/analyze-resume", () => ({ analyzeResume: analyzeResumeMock }));
vi.mock("@/lib/ats/load-vacancy-market", () => ({ loadVacancyMarket: loadVacancyMarketMock }));

import { resumeAnalysisMutationOptions } from "@/hooks/useResumeAnalysisMutation";

const market = createBaselineMarketData();
const analysisResult = {
  basicAnalysis: validModelResponse.basicAnalysis,
  atsAnalysis: finalizeAtsAnalysis(RawAtsAnalysisSchema.parse(validModelResponse.atsAnalysis), market),
};

const createMutation = (queryClient: QueryClient) =>
  queryClient.getMutationCache().build(queryClient, resumeAnalysisMutationOptions(queryClient, () => "secret"));

describe("resume analysis mutation", () => {
  const queryClients: QueryClient[] = [];

  afterEach(() => {
    queryClients.splice(0).forEach((queryClient) => queryClient.clear());
    vi.clearAllMocks();
  });

  const createQueryClient = () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    queryClients.push(queryClient);
    return queryClient;
  };

  it("exposes pending state while analysis is running", async () => {
    let resolveAnalysis: (value: typeof analysisResult) => void = () => undefined;
    analyzeResumeMock.mockReturnValue(new Promise((resolve) => (resolveAnalysis = resolve)));
    loadVacancyMarketMock.mockResolvedValue(market);
    const queryClient = createQueryClient();
    const mutation = createMutation(queryClient);

    const execution = mutation.execute({ file: new File(["pdf"], "resume.pdf"), model: "model" });

    await vi.waitFor(() => expect(analyzeResumeMock).toHaveBeenCalledOnce());
    expect(mutation.state.status).toBe("pending");
    resolveAnalysis(analysisResult);
    await execution;
  });

  it("stores a successful analysis as mutation data", async () => {
    analyzeResumeMock.mockResolvedValue(analysisResult);
    loadVacancyMarketMock.mockResolvedValue(market);
    const queryClient = createQueryClient();
    const mutation = createMutation(queryClient);
    const file = new File(["pdf"], "resume.pdf");

    await mutation.execute({ file, model: "model" });

    expect(mutation.state.status).toBe("success");
    expect(mutation.state.data).toMatchObject({ file, model: "model", result: analysisResult, market });
    expect(analyzeResumeMock).toHaveBeenCalledWith(file, "secret", "model", market);
  });

  it("stores a failed analysis as mutation error without retry", async () => {
    const error = new Error("provider unavailable");
    analyzeResumeMock.mockRejectedValue(error);
    loadVacancyMarketMock.mockResolvedValue(market);
    const queryClient = createQueryClient();
    const mutation = createMutation(queryClient);

    await expect(mutation.execute({ file: new File(["pdf"], "resume.pdf"), model: "model" })).rejects.toBe(error);

    expect(mutation.state.status).toBe("error");
    expect(mutation.state.error).toBe(error);
    expect(analyzeResumeMock).toHaveBeenCalledTimes(1);
  });
});
