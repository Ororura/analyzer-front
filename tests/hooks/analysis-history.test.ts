import { describe, expect, it, vi } from "vitest";
import { restoreHistoryEntry } from "@/hooks/useAnalysisHistory";
import { getHistory } from "@/lib/utils/storage";
import type { HistoryEntry } from "@/types";
import { resumeAnalysisResult } from "../fixtures/resume-analysis";

describe("analysis history restore", () => {
  it("keeps legacy markdown readable", () => {
    const entry: HistoryEntry = { id: "legacy", fileName: "old.pdf", model: "saved-model", createdAt: "2026-08-27T00:00:00Z", result: "# Saved result" };
    expect(restoreHistoryEntry(entry)).toMatchObject({ kind: "legacy", markdown: "# Saved result" });
  });

  it("restores a versioned backend result", () => {
    const entry: HistoryEntry = { version: 3, id: "new", fileName: "new.pdf", createdAt: "2026-08-28T00:00:00Z", result: resumeAnalysisResult };
    const restored = restoreHistoryEntry(entry);
    expect(restored).toMatchObject({ kind: "backend", result: resumeAnalysisResult });
    expect(restored.file.name).toBe("new.pdf");
  });

  it("migrates version 2 fixed scores to dynamic assessments", () => {
    let stored: string | null = null;
    vi.stubGlobal("localStorage", {
      getItem: () => stored,
      setItem: (_key: string, value: string) => { stored = value; },
      removeItem: () => { stored = null; },
    });
    localStorage.setItem("pdf-analyzer-history", JSON.stringify([{
      version: 2,
      id: "old-backend",
      fileName: "old-backend.pdf",
      createdAt: "2026-08-27T00:00:00Z",
      result: {
        ...resumeAnalysisResult,
        scores: {
          java: 8,
          spring: 7,
          commercialExperience: 6,
          experienceDescription: 5,
          ats: 73,
          resumeQuality: 81,
        },
        metadata: {
          analysisVersion: "2",
          baselineVersion: "2026-08",
          generatedAt: "2026-08-27T00:00:00Z",
          provider: "CODEX_CLI",
          model: null,
        },
      },
    }]));
    const [entry] = getHistory();
    expect(entry && "version" in entry ? entry.version : undefined).toBe(3);
    expect(entry && "version" in entry ? entry.result.metadata.analysisProfile : undefined).toBe("JAVA_BACKEND");
    expect(entry && "version" in entry ? entry.result.scores.assessments : []).toEqual([
      { criterionId: "java", score: 8, evidence: [] },
      { criterionId: "spring", score: 7, evidence: [] },
    ]);
    vi.unstubAllGlobals();
  });
});
