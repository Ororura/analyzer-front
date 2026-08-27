import { describe, expect, it } from "vitest";
import { restoreHistoryEntry } from "@/hooks/useAnalysisHistory";
import type { HistoryEntry } from "@/types";

describe("analysis history restore", () => {
  it("keeps a restored result separate from mutation data", () => {
    const entry: HistoryEntry = {
      id: "history-1",
      fileName: "restored.pdf",
      model: "saved-model",
      createdAt: "2026-08-27T00:00:00.000Z",
      result: "saved result",
    };

    const restored = restoreHistoryEntry(entry);

    expect(restored).toMatchObject({ result: "saved result", model: "saved-model", atsResult: null });
    expect(restored.file.name).toBe("restored.pdf");
  });
});
