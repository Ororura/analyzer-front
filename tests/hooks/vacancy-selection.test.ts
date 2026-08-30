import { describe, expect, it } from "vitest";
import { getPageSelectionState, isVacancySelected, resetSelectionForAppliedCriteria, setPageSelection, toggleVacancy } from "@/hooks/useVacancySelection";
import type { VacancySelection } from "@/types/vacancy";

describe("vacancy selection", () => {
  it("selects, deselects and never duplicates IDs", () => {
    let selection: VacancySelection = { mode: "SELECTED", vacancyIds: [] };
    selection = toggleVacancy(selection, "hh-1", true);
    selection = toggleVacancy(selection, "hh-1", true);
    expect(selection).toEqual({ mode: "SELECTED", vacancyIds: ["hh-1"] });
    expect(toggleVacancy(selection, "hh-1", false)).toEqual({ mode: "SELECTED", vacancyIds: [] });
  });

  it("selects a page and reports indeterminate state", () => {
    let selection: VacancySelection = { mode: "SELECTED", vacancyIds: ["existing"] };
    selection = setPageSelection(selection, ["hh-1", "hh-2"], true);
    expect(selection).toEqual({ mode: "SELECTED", vacancyIds: ["existing", "hh-1", "hh-2"] });
    expect(getPageSelectionState(selection, ["hh-1", "hh-2"])).toBe("checked");
    selection = toggleVacancy(selection, "hh-1", false);
    expect(getPageSelectionState(selection, ["hh-1", "hh-2"])).toBe("indeterminate");
    expect((selection as Extract<VacancySelection, { mode: "SELECTED" }>).vacancyIds).toContain("existing");
  });

  it("models ALL_MATCHING exclusions and re-inclusion", () => {
    let selection: VacancySelection = {
      mode: "ALL_MATCHING",
      criteria: { query: "Java", page: 0, pageSize: 20 },
      excludedVacancyIds: [],
    };
    expect(isVacancySelected(selection, "hh-1")).toBe(true);
    selection = toggleVacancy(selection, "hh-1", false);
    selection = toggleVacancy(selection, "hh-1", false);
    expect(selection.excludedVacancyIds).toEqual(["hh-1"]);
    expect(getPageSelectionState(selection, ["hh-1", "hh-2"])).toBe("indeterminate");
    selection = toggleVacancy(selection, "hh-1", true);
    expect(selection.excludedVacancyIds).toEqual([]);
  });

  it("resets ALL_MATCHING for newly applied filters but retains explicit IDs", () => {
    const allMatching: VacancySelection = { mode: "ALL_MATCHING", criteria: { page: 0, pageSize: 20 }, excludedVacancyIds: ["hh-1"] };
    expect(resetSelectionForAppliedCriteria(allMatching)).toEqual({ mode: "SELECTED", vacancyIds: [] });
    const selected: VacancySelection = { mode: "SELECTED", vacancyIds: ["hh-2"] };
    expect(resetSelectionForAppliedCriteria(selected)).toBe(selected);
  });
});
