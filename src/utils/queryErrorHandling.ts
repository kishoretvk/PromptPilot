// Enhanced React Query Error Handling Utilities
// Provides comprehensive error handling for React Query mutations and queries

import { QueryClient, UseQueryOptions, UseMutationOptions, MutationFunction, QueryFunction } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { errorHandler, withErrorHandling, ErrorContext } from './errorHandling';

// Error retry configuration
export const retryConfig = {
  // Retry network errors and 5xx server errors
  retry: (failureCount: number, error: any) => {
    // Don't retry on client errors (4xx)
    if (error?.response?.status && error.response.status >= 400 && error.response.status < 500) {
      return false;
    }
    
    // Don't retry authentication errors
    if (error?.response?.status === 401) {
      return false;
    }
    
    // Retry up to 3 times for other errors
    return failureCount < 3;
  },
  
  // Exponential backoff delay
  retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
};

// Stale time configuration for different data types
export const staleTimeConfig = {
  // User settings change infrequently
  settings: 5 * 60 * 1000, // 5 minutes
  
  // User profile data
  profile: 10 * 60 * 1000, // 10 minutes
  
  // Static data like lists of options
  static: 30 * 60 * 1000, // 30 minutes
  
  // Frequently changing data
  dynamic: 30 * 1000, // 30 seconds
  
  // Real-time data
  realtime: 0, // Always fresh
};

// Cache time configuration (gcTime in React Query v5)
export const gcTimeConfig = {
  default: 10 * 60 * 1000, // 10 minutes
  longTerm: 60 * 60 * 1000, // 1 hour
  shortTerm: 2 * 60 * 1000, // 2 minutes
};

// Legacy alias for backwards compatibility
export const cacheTimeConfig = gcTimeConfig;

// Enhanced query options factory
export function createQueryOptions<T>(
  queryKey: string[],
  queryFn: QueryFunction<T>,
  options: {
    context?: ErrorContext;
    staleTime?: keyof typeof staleTimeConfig | number;
    gcTime?: keyof typeof gcTimeConfig | number;
    showErrorToast?: boolean;
    errorMessage?: string;
  } = {}
): UseQueryOptions<T> {
  const {
    context = {},
    staleTime = 'dynamic',
    gcTime = 'default',
    showErrorToast = true,
    errorMessage,
  } = options;

  return {
    queryKey,
    queryFn: withErrorHandling(queryFn, {
      component: context.component || 'Query',
      action: context.action || queryKey.join('_'),
      ...context,
    }),
    staleTime: typeof staleTime === 'number' ? staleTime : staleTimeConfig[staleTime],
    gcTime: typeof gcTime === 'number' ? gcTime : gcTimeConfig[gcTime], // React Query v5 uses gcTime instead of cacheTime
    ...retryConfig,
    // Note: In React Query v5, onError is handled at the hook level, not in options
    meta: {
      errorContext: context,
      showErrorToast,
      errorMessage: errorMessage || `Failed to load ${queryKey.join(' ')}`,
    },
  };
}

// Enhanced mutation options factory
export function createMutationOptions<TData, TError, TVariables>(
  mutationFn: MutationFunction<TData, TVariables>,
  options: {
    context?: ErrorContext;
    showErrorToast?: boolean;
    showSuccessToast?: boolean;
    errorMessage?: string;
    successMessage?: string;
    onSuccess?: (data: TData, variables: TVariables) => void | Promise<void>;
    onError?: (error: TError, variables: TVariables) => void;
    onSettled?: (data: TData | undefined, error: TError | null, variables: TVariables) => void;
  } = {}
): UseMutationOptions<TData, TError, TVariables> {
  const {
    context = {},
    showErrorToast = true,
    showSuccessToast = false,
    errorMessage,
    successMessage,
    onSuccess,
    onError,
    onSettled,
  } = options;

  return {
    mutationFn: withErrorHandling(mutationFn, {
      component: context.component || 'Mutation',
      action: context.action || 'mutate',
      ...context,
    }),
    onSuccess: async (data: TData, variables: TVariables, ctx: any) => {
      if (showSuccessToast && successMessage) {
        toast.success(successMessage, {
          position: 'top-right',
          autoClose: 3000,
        });
      }

      if (onSuccess) {
        try {
          await onSuccess(data, variables);
        } catch (error) {
          errorHandler.logError(
            errorHandler.createError(
              'Error in onSuccess callback',
              'MUTATION_SUCCESS_CALLBACK_ERROR',
              error
            ),
            'warning',
            {
              component: context.component || 'Mutation',
              action: 'success_callback',
              ...context,
            }
          );
        }
      }
    },
    onError: (error: TError, variables: TVariables, ctx: any) => {
      const appError = errorHandler.handleAPIError(error as any, {
        component: context.component || 'Mutation',
        action: context.action || 'mutate',
        ...context,
      });

      if (showErrorToast) {
        const message = errorMessage || 'Operation failed. Please try again.';
        toast.error(message, {
          toastId: `mutation-error-${context.component}-${context.action}`,
        });
      }

      if (onError) {
        try {
          onError(error, variables);
        } catch (callbackError) {
          errorHandler.logError(
            errorHandler.createError(
              'Error in onError callback',
              'MUTATION_ERROR_CALLBACK_ERROR',
              callbackError
            ),
            'warning',
            {
              component: context.component || 'Mutation',
              action: 'error_callback',
              ...context,
            }
          );
        }
      }
    },
    onSettled: (data: TData | undefined, error: TError | null, variables: TVariables, ctx: any) => {
      if (onSettled) {
        try {
          onSettled(data, error, variables);
        } catch (callbackError) {
          errorHandler.logError(
            errorHandler.createError(
              'Error in onSettled callback',
              'MUTATION_SETTLED_CALLBACK_ERROR',
              callbackError
            ),
            'warning',
            {
              component: context.component || 'Mutation',
              action: 'settled_callback',
              ...context,
            }
          );
        }
      }
    },
  };
}

// Query client with enhanced error handling
export function createEnhancedQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: staleTimeConfig.dynamic,
        gcTime: gcTimeConfig.default, // React Query v5 uses gcTime instead of cacheTime
        ...retryConfig,
        // Global error handling moved to hook level in v5
      },
      mutations: {
        // Global mutation error handling moved to hook level in v5
      },
    },
  });
}

// Optimistic update helpers
export const optimisticUpdateHelpers = {
  // Add item to list optimistically
  addToList: <T extends { id: string }>(
    queryClient: QueryClient,
    queryKey: string[],
    newItem: T
  ) => {
    queryClient.setQueryData(queryKey, (oldData: T[] | undefined) => {
      if (!oldData) return [newItem];
      return [...oldData, newItem];
    });
  },

  // Update item in list optimistically
  updateInList: <T extends { id: string }>(
    queryClient: QueryClient,
    queryKey: string[],
    itemId: string,
    updatedFields: Partial<T>
  ) => {
    queryClient.setQueryData(queryKey, (oldData: T[] | undefined) => {
      if (!oldData) return oldData;
      return oldData.map(item =>
        item.id === itemId ? { ...item, ...updatedFields } : item
      );
    });
  },

  // Remove item from list optimistically
  removeFromList: <T extends { id: string }>(
    queryClient: QueryClient,
    queryKey: string[],
    itemId: string
  ) => {
    queryClient.setQueryData(queryKey, (oldData: T[] | undefined) => {
      if (!oldData) return oldData;
      return oldData.filter(item => item.id !== itemId);
    });
  },

  // Update single item optimistically
  updateSingle: <T>(
    queryClient: QueryClient,
    queryKey: string[],
    updatedFields: Partial<T>
  ) => {
    queryClient.setQueryData(queryKey, (oldData: T | undefined) => {
      if (!oldData) return oldData;
      return { ...oldData, ...updatedFields };
    });
  },
};

// Cache invalidation helpers
export const cacheHelpers = {
  // Invalidate related queries
  invalidateRelated: (queryClient: QueryClient, baseKey: string) => {
    queryClient.invalidateQueries({
      predicate: (query) => {
        return query.queryKey[0] === baseKey;
      },
    });
  },

  // Remove specific queries
  removeQueries: (queryClient: QueryClient, queryKey: string[]) => {
    queryClient.removeQueries({ queryKey });
  },

  // Refetch specific queries
  refetchQueries: (queryClient: QueryClient, queryKey: string[]) => {
    return queryClient.refetchQueries({ queryKey });
  },

  // Clear all cache
  clearAll: (queryClient: QueryClient) => {
    queryClient.clear();
  },

  // Get cached data
  getCachedData: <T>(queryClient: QueryClient, queryKey: string[]): T | undefined => {
    return queryClient.getQueryData<T>(queryKey);
  },

  // Set cached data
  setCachedData: <T>(queryClient: QueryClient, queryKey: string[], data: T) => {
    queryClient.setQueryData(queryKey, data);
  },
};

// Connection status aware query options
export function createOfflineAwareQueryOptions<T>(
  queryKey: string[],
  queryFn: QueryFunction<T>,
  options: Parameters<typeof createQueryOptions>[2] = {}
): UseQueryOptions<T> {
  const baseOptions = createQueryOptions(queryKey, queryFn, options);

  return {
    ...baseOptions,
    // Don't refetch when coming back online if we have cached data
    refetchOnReconnect: (query) => {
      return !query.state.data;
    },
    // Retry more aggressively when offline
    retry: (failureCount: number, error: any) => {
      if (!navigator.onLine) {
        return failureCount < 5; // More retries when offline
      }
      // Use the base retry logic if it's a function, otherwise use default
      if (typeof baseOptions.retry === 'function') {
        return baseOptions.retry(failureCount, error);
      } else if (typeof baseOptions.retry === 'number') {
        return failureCount < baseOptions.retry;
      } else if (typeof baseOptions.retry === 'boolean') {
        return baseOptions.retry && failureCount < 3;
      }
      return false;
    },
    // Longer retry delay when offline
    retryDelay: (attemptIndex: number, error: Error) => {
      if (!navigator.onLine) {
        return Math.min(1000 * 2 ** attemptIndex, 60000); // Max 1 minute
      }
      // Use the base retry delay if it's a function, otherwise use default
      if (typeof baseOptions.retryDelay === 'function') {
        return baseOptions.retryDelay(attemptIndex, error);
      }
      return 1000;
    },
  };
}

// Query key factories for consistent naming
export const queryKeys = {
  prompts: {
    all: ['prompts'] as const,
    lists: () => [...queryKeys.prompts.all, 'list'] as const,
    list: (filters: Record<string, any>) => [...queryKeys.prompts.lists(), filters] as const,
    details: () => [...queryKeys.prompts.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.prompts.details(), id] as const,
    versions: (id: string) => [...queryKeys.prompts.detail(id), 'versions'] as const,
    executions: (id: string) => [...queryKeys.prompts.detail(id), 'executions'] as const,
  },
  pipelines: {
    all: ['pipelines'] as const,
    lists: () => [...queryKeys.pipelines.all, 'list'] as const,
    list: (filters: Record<string, any>) => [...queryKeys.pipelines.lists(), filters] as const,
    details: () => [...queryKeys.pipelines.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.pipelines.details(), id] as const,
    executions: (id: string) => [...queryKeys.pipelines.detail(id), 'executions'] as const,
  },
  analytics: {
    all: ['analytics'] as const,
    usage: (timeRange: string) => [...queryKeys.analytics.all, 'usage', timeRange] as const,
    performance: (timeRange: string) => [...queryKeys.analytics.all, 'performance', timeRange] as const,
    costs: (timeRange: string) => [...queryKeys.analytics.all, 'costs', timeRange] as const,
  },
  settings: {
    all: ['settings'] as const,
    theme: () => [...queryKeys.settings.all, 'theme'] as const,
    notifications: () => [...queryKeys.settings.all, 'notifications'] as const,
    security: () => [...queryKeys.settings.all, 'security'] as const,
    integrations: () => [...queryKeys.settings.all, 'integrations'] as const,
    apiKeys: () => [...queryKeys.settings.all, 'apiKeys'] as const,
  },
};

export default {
  createQueryOptions,
  createMutationOptions,
  createEnhancedQueryClient,
  optimisticUpdateHelpers,
  cacheHelpers,
  createOfflineAwareQueryOptions,
  queryKeys,
  retryConfig,
  staleTimeConfig,
  gcTimeConfig,
  cacheTimeConfig, // Legacy alias
};