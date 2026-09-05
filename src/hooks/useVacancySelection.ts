import { useCallback, useMemo, useState } from 'react';
import type { VacancySearchCriteria, VacancySelection } from '@/types/vacancy';

export type PageSelectionState = 'unchecked' | 'indeterminate' | 'checked';

const unique = (ids: string[]): string[] => [...new Set(ids)];

export const isVacancySelected = (selection: VacancySelection, id: string): boolean =>
  selection.mode === 'SELECTED' ? selection.vacancyIds.includes(id) : !selection.excludedVacancyIds.includes(id);

export const getPageSelectionState = (selection: VacancySelection, ids: string[]): PageSelectionState => {
  if (ids.length === 0) return 'unchecked';
  const selected = ids.filter((id) => isVacancySelected(selection, id)).length;
  if (selected === 0) return 'unchecked';
  if (selected === ids.length) return 'checked';
  return 'indeterminate';
};

export const toggleVacancy = (selection: VacancySelection, id: string, checked: boolean): VacancySelection => {
  if (selection.mode === 'SELECTED') {
    return {
      mode: 'SELECTED',
      vacancyIds: checked
        ? unique([...selection.vacancyIds, id])
        : selection.vacancyIds.filter((selectedId) => selectedId !== id),
    };
  }
  return {
    ...selection,
    excludedVacancyIds: checked
      ? selection.excludedVacancyIds.filter((excludedId) => excludedId !== id)
      : unique([...selection.excludedVacancyIds, id]),
  };
};

export const setPageSelection = (selection: VacancySelection, ids: string[], checked: boolean): VacancySelection =>
  ids.reduce((next, id) => toggleVacancy(next, id, checked), selection);

export const resetSelectionForAppliedCriteria = (selection: VacancySelection): VacancySelection =>
  selection.mode === 'ALL_MATCHING' ? { mode: 'SELECTED', vacancyIds: [] } : selection;

export function useVacancySelection() {
  const [selection, setSelection] = useState<VacancySelection>({ mode: 'SELECTED', vacancyIds: [] });

  const toggle = useCallback((id: string, checked: boolean) => {
    setSelection((current) => toggleVacancy(current, id, checked));
  }, []);

  const setPage = useCallback((ids: string[], checked: boolean) => {
    setSelection((current) => setPageSelection(current, ids, checked));
  }, []);

  const selectAllMatching = useCallback((criteria: VacancySearchCriteria) => {
    setSelection({ mode: 'ALL_MATCHING', criteria: { ...criteria, page: 0 }, excludedVacancyIds: [] });
  }, []);

  const clear = useCallback(() => setSelection({ mode: 'SELECTED', vacancyIds: [] }), []);

  const resetAllMatching = useCallback(() => {
    setSelection(resetSelectionForAppliedCriteria);
  }, []);

  const selectedCount = useMemo(
    () => (selection.mode === 'SELECTED' ? selection.vacancyIds.length : undefined),
    [selection],
  );

  return {
    selection,
    selectedCount,
    isSelected: (id: string) => isVacancySelected(selection, id),
    pageState: (ids: string[]) => getPageSelectionState(selection, ids),
    toggle,
    setPage,
    selectAllMatching,
    clear,
    resetAllMatching,
  };
}
