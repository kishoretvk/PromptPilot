import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { analyticsService } from '../services/AnalyticsService';
import { queryKeys } from './queryClient';
import {
  AnalyticsFilter,
} from '../types';

// Hook for fetching usage metrics
export const useUsageMetrics = (timeRange = '30d', filters?: Omit<AnalyticsFilter, 'date_range'>) => {
  // Provide default date range if not specified
  const defaultDateRange = {
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  };
  
  // Include timeRange in the filters object
  const usageFilters: AnalyticsFilter = {
    date_range: defaultDateRange,
    ...filters
  };
  
  return useQuery({
    queryKey: queryKeys.analytics.usage({ timeRange, ...filters }),
    queryFn: () => analyticsService.getUsageMetrics(usageFilters),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Hook for fetching performance data
export const usePerformanceData = (timeRange = '30d', promptIds?: string[]) => {
  return useQuery({
    queryKey: queryKeys.analytics.performance({ timeRange, promptIds }),
    queryFn: () => analyticsService.getPerformanceData(timeRange, promptIds),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Hook for fetching cost analysis
export const useCostData = (timeRange = '30d', filters?: AnalyticsFilter) => {
  return useQuery({
    queryKey: queryKeys.analytics.costs({ timeRange, ...filters }),
    queryFn: () => analyticsService.getCostAnalysis(timeRange, filters),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Hook for fetching dashboard data
export const useDashboardData = (timeRange = '30d') => {
  return useQuery({
    queryKey: queryKeys.analytics.dashboard(timeRange),
    queryFn: () => analyticsService.getDashboardData(timeRange),
    staleTime: 1 * 60 * 1000, // 1 minute for dashboard
  });
};

// Hook for fetching execution trends
export const useExecutionTrends = (timeRange = '30d', granularity = 'day') => {
  return useQuery({
    queryKey: [...queryKeys.analytics.all, 'trends', { timeRange, granularity }],
    queryFn: () => analyticsService.getExecutionTrends(timeRange, granularity),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook for fetching error analysis
export const useErrorAnalysis = (timeRange = '30d') => {
  return useQuery({
    queryKey: [...queryKeys.analytics.all, 'errors', { timeRange }],
    queryFn: () => analyticsService.getErrorAnalysis(timeRange),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook for fetching provider comparison
export const useProviderComparison = (timeRange = '30d') => {
  return useQuery({
    queryKey: [...queryKeys.analytics.all, 'providers', { timeRange }],
    queryFn: () => analyticsService.getProviderComparison(timeRange),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Hook for fetching prompt leaderboard
export const usePromptLeaderboard = (timeRange = '30d', metric = 'executions', limit = 10) => {
  return useQuery({
    queryKey: [...queryKeys.analytics.all, 'leaderboard', { timeRange, metric, limit }],
    queryFn: () => analyticsService.getPromptLeaderboard(timeRange, metric, limit),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook for fetching user activity
export const useUserActivity = (timeRange = '30d') => {
  return useQuery({
    queryKey: [...queryKeys.analytics.all, 'userActivity', { timeRange }],
    queryFn: () => analyticsService.getUserActivity(timeRange),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook for fetching system health
export const useSystemHealth = () => {
  return useQuery({
    queryKey: [...queryKeys.analytics.all, 'systemHealth'],
    queryFn: () => analyticsService.getSystemHealth(),
    staleTime: 30 * 1000, // 30 seconds for health checks
    refetchInterval: 60 * 1000, // Refetch every minute
  });
};

// Hook for fetching realtime metrics
export const useRealtimeMetrics = () => {
  return useQuery({
    queryKey: [...queryKeys.analytics.all, 'realtime'],
    queryFn: () => analyticsService.getRealtimeMetrics(),
    staleTime: 5 * 1000, // 5 seconds for realtime
    refetchInterval: 10 * 1000, // Refetch every 10 seconds
  });
};

// Hook for custom analytics queries
export const useCustomMetrics = (query: string, timeRange = '30d', enabled = true) => {
  return useQuery({
    queryKey: [...queryKeys.analytics.all, 'custom', { query, timeRange }],
    queryFn: () => analyticsService.getCustomMetrics(query, timeRange),
    enabled: enabled && !!query,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook for exporting analytics data
export const useExportAnalytics = () => {
  return useMutation({
    mutationFn: ({ filters, format }: { filters: AnalyticsFilter; format?: 'csv' | 'json' | 'xlsx' }) =>
      analyticsService.exportData(filters, format),
  });
};

// Hook for managing alerts
export const useCreateAlert = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (alertConfig: any) => analyticsService.createAlert(alertConfig),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...queryKeys.analytics.all, 'alerts'],
      });
    },
  });
};

export const useAnalyticsAlerts = () => {
  return useQuery({
    queryKey: [...queryKeys.analytics.all, 'alerts'],
    queryFn: () => analyticsService.getAlerts(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useUpdateAlert = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, config }: { id: string; config: any }) =>
      analyticsService.updateAlert(id, config),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...queryKeys.analytics.all, 'alerts'],
      });
    },
  });
};

export const useDeleteAlert = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => analyticsService.deleteAlert(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...queryKeys.analytics.all, 'alerts'],
      });
    },
  });
};

// Utility hook for analytics operations
export const useAnalyticsOperations = () => {
  const exportMutation = useExportAnalytics();
  const createAlertMutation = useCreateAlert();
  const updateAlertMutation = useUpdateAlert();
  const deleteAlertMutation = useDeleteAlert();
  
  return {
    export: exportMutation.mutate,
    createAlert: createAlertMutation.mutate,
    updateAlert: updateAlertMutation.mutate,
    deleteAlert: deleteAlertMutation.mutate,
    
    // Loading states
    isExporting: exportMutation.isPending,
    isCreatingAlert: createAlertMutation.isPending,
    isUpdatingAlert: updateAlertMutation.isPending,
    isDeletingAlert: deleteAlertMutation.isPending,
    
    // Error states
    exportError: exportMutation.error,
    createAlertError: createAlertMutation.error,
    updateAlertError: updateAlertMutation.error,
    deleteAlertError: deleteAlertMutation.error,
  };
};

// Main analytics hook that combines all analytics functionality
export const useAnalytics = () => {
  return {
    useUsageMetrics,
    usePerformanceData,
    useCostData,
    useDashboardData,
    useExecutionTrends,
    useErrorAnalysis,
    useProviderComparison,
    usePromptLeaderboard,
    useUserActivity,
    useSystemHealth,
    useRealtimeMetrics,
    useCustomMetrics,
    useExportAnalytics,
    useAnalyticsAlerts,
    useCreateAlert,
    useUpdateAlert,
    useDeleteAlert,
    useAnalyticsOperations,
  };
};