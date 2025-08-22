import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import React, { ReactNode } from 'react';

// React Query configuration
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Stale time: how long data is considered fresh
      staleTime: 5 * 60 * 1000, // 5 minutes
      // Cache time: how long data stays in cache after component unmount
      gcTime: 10 * 60 * 1000, // 10 minutes (was cacheTime in v4)
      // Retry configuration
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors (client errors)
        if (error?.response?.status >= 400 && error?.response?.status < 500) {
          return false;
        }
        // Retry up to 3 times for server errors
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Don't refetch on window focus in development
      refetchOnWindowFocus: process.env.NODE_ENV === 'production',
      // Don't refetch on reconnect aggressively
      refetchOnReconnect: 'always',
      // Refetch interval (useful for real-time data)
      refetchInterval: false,
    },
    mutations: {
      retry: 1,
      retryDelay: 1000,
    },
  },
});

interface QueryProviderProps {
  children: ReactNode;
}

export const QueryProvider: React.FC<QueryProviderProps> = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* Show React Query DevTools in development */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
};

// Query keys factory for consistent key management
export const queryKeys = {
  // Prompts
  prompts: {
    all: ['prompts'] as const,
    lists: () => [...queryKeys.prompts.all, 'list'] as const,
    list: (filters: Record<string, any>) => [...queryKeys.prompts.lists(), filters] as const,
    details: () => [...queryKeys.prompts.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.prompts.details(), id] as const,
    versions: (id: string) => [...queryKeys.prompts.detail(id), 'versions'] as const,
    tests: (id: string) => [...queryKeys.prompts.detail(id), 'tests'] as const,
  },
  
  // Pipelines
  pipelines: {
    all: ['pipelines'] as const,
    lists: () => [...queryKeys.pipelines.all, 'list'] as const,
    list: (filters: Record<string, any>) => [...queryKeys.pipelines.lists(), filters] as const,
    details: () => [...queryKeys.pipelines.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.pipelines.details(), id] as const,
    executions: (id: string) => [...queryKeys.pipelines.detail(id), 'executions'] as const,
  },
  
  // Analytics
  analytics: {
    all: ['analytics'] as const,
    usage: (filters: Record<string, any>) => [...queryKeys.analytics.all, 'usage', filters] as const,
    performance: (filters: Record<string, any>) => [...queryKeys.analytics.all, 'performance', filters] as const,
    costs: (filters: Record<string, any>) => [...queryKeys.analytics.all, 'costs', filters] as const,
  },
  
  // Settings
  settings: {
    all: ['settings'] as const,
    apiKeys: () => [...queryKeys.settings.all, 'apiKeys'] as const,
    providers: () => [...queryKeys.settings.all, 'providers'] as const,
    system: () => [...queryKeys.settings.all, 'system'] as const,
  },
  
  // System
  system: {
    health: ['system', 'health'] as const,
    stats: ['system', 'stats'] as const,
  },
} as const;

// Utility functions for cache management
export const cacheUtils = {
  // Invalidate all queries for a specific resource
  invalidatePrompts: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.prompts.all });
  },
  
  invalidatePipelines: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.pipelines.all });
  },
  
  invalidateAnalytics: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.analytics.all });
  },
  
  invalidateSettings: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.settings.all });
  },
  
  // Prefetch data
  prefetchPrompts: async (filters: Record<string, any> = {}) => {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.prompts.list(filters),
      queryFn: () => import('../services/PromptService').then(({ promptService }) => 
        promptService.getPrompts(filters.page, filters.limit, filters.search, filters.tags)
      ),
      staleTime: 5 * 60 * 1000,
    });
  },
  
  // Remove specific queries from cache
  removePrompt: (id: string) => {
    queryClient.removeQueries({ queryKey: queryKeys.prompts.detail(id) });
  },
  
  removePipeline: (id: string) => {
    queryClient.removeQueries({ queryKey: queryKeys.pipelines.detail(id) });
  },
  
  // Update cache data directly
  updatePromptCache: (id: string, updater: (oldData: any) => any) => {
    queryClient.setQueryData(queryKeys.prompts.detail(id), updater);
  },
  
  updatePipelineCache: (id: string, updater: (oldData: any) => any) => {
    queryClient.setQueryData(queryKeys.pipelines.detail(id), updater);
  },
  
  // Get cached data
  getCachedPrompt: (id: string) => {
    return queryClient.getQueryData(queryKeys.prompts.detail(id));
  },
  
  getCachedPipeline: (id: string) => {
    return queryClient.getQueryData(queryKeys.pipelines.detail(id));
  },
  
  // Clear all cache
  clearCache: () => {
    queryClient.clear();
  },
};

export default queryClient;