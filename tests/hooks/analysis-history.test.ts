import { describe, expect, it } from "vitest";
import { restoreHistoryEntry } from "@/hooks/useAnalysisHistory";
import type { HistoryEntry } from "@/types";
import { resumeAnalysisResult } from "../fixtures/resume-analysis";

describe("analysis history restore", () => {
  it("keeps legacy markdown readable", () => {
    const entry: HistoryEntry = { id: "legacy", fileName: "old.pdf", model: "saved-model", createdAt: "2026-08-27T00:00:00Z", result: "# Saved result" };
    expect(restoreHistoryEntry(entry)).toMatchObject({ kind: "legacy", markdown: "# Saved result" });
  });

  it("restores a versioned backend result", () => {
    const entry: HistoryEntry = { version: 2, id: "new", fileName: "new.pdf", createdAt: "2026-08-28T00:00:00Z", result: resumeAnalysisResult };
    const restored = restoreHistoryEntry(entry);
    expect(restored).toMatchObject({ kind: "backend", result: resumeAnalysisResult });
    expect(restored.file.name).toBe("new.pdf");
  });
});
