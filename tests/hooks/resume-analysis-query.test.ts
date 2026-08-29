import { QueryClient } from "@tanstack/react-query";
import { afterEach, describe, expect, it, vi } from "vitest";
import { resumeAnalysisResult } from "../fixtures/resume-analysis";

const { analyzeResumeMock } = vi.hoisted(() => ({ analyzeResumeMock: vi.fn() }));
vi.mock("@/lib/api/resume", () => ({ analyzeResume: analyzeResumeMock }));

import { resumeAnalysisMutationOptions } from "@/hooks/useResumeAnalysisMutation";

describe("resume analysis mutation", () => {
  const clients: QueryClient[] = [];
  afterEach(() => { clients.splice(0).forEach((client) => client.clear()); vi.clearAllMocks(); });

  const createMutation = () => {
    const client = new QueryClient();
    clients.push(client);
    return client.getMutationCache().build(client, resumeAnalysisMutationOptions());
  };

  it("keeps pending state until the backend analysis completes", async () => {
    let resolveAnalysis: (value: typeof resumeAnalysisResult) => void = () => undefined;
    analyzeResumeMock.mockReturnValue(new Promise((resolve) => { resolveAnalysis = resolve; }));
    const mutation = createMutation();
    const execution = mutation.execute({ file: new File(["pdf"], "resume.pdf"), provider: "CODEX_CLI" });
    await vi.waitFor(() => expect(mutation.state.status).toBe("pending"));
    resolveAnalysis(resumeAnalysisResult);
    await execution;
    expect(mutation.state.status).toBe("success");
  });

  it("passes the selected provider and preserves backend values", async () => {
    analyzeResumeMock.mockResolvedValue(resumeAnalysisResult);
    const file = new File(["pdf"], "resume.pdf");
    const result = await createMutation().execute({ file, provider: "CODEX_CLI" });
    expect(analyzeResumeMock).toHaveBeenCalledWith(file, { provider: "CODEX_CLI", signal: undefined });
    expect(result.result).toBe(resumeAnalysisResult);
    expect(result.result).toMatchObject({ overallScore: 67, detectedLevel: "middle_minus", experience: { commercialMonths: 29 } });
  });

  it("does not retry or fall back after a provider error", async () => {
    const error = new Error("provider failed");
    analyzeResumeMock.mockRejectedValue(error);
    await expect(createMutation().execute({ file: new File(["pdf"], "resume.pdf"), provider: "CODEX_CLI" })).rejects.toBe(error);
    expect(analyzeResumeMock).toHaveBeenCalledTimes(1);
  });
});
