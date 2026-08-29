import { queryOptions, useQuery } from "@tanstack/react-query";
import { getAiProviders } from "@/lib/api/resume";

export const aiProvidersQueryKey = ["ai-providers"] as const;

export const aiProvidersQueryOptions = () =>
  queryOptions({
    queryKey: aiProvidersQueryKey,
    queryFn: ({ signal }) => getAiProviders(signal),
    staleTime: 60_000,
  });

export const useAiProvidersQuery = () => useQuery(aiProvidersQueryOptions());
