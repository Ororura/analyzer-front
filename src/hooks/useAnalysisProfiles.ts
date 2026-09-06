import { useQuery } from '@tanstack/react-query';
import { listAnalysisProfiles } from '@/lib/api/analysis-profiles';

export const analysisProfilesQueryKey = ['analysis-profiles'] as const;

export function useAnalysisProfiles() {
  return useQuery({
    queryKey: analysisProfilesQueryKey,
    queryFn: ({ signal }) => listAnalysisProfiles(signal),
  });
}

