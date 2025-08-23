import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pipelineService } from '../services/PipelineService';
import { queryKeys } from './queryClient';
import {
  Pipeline,
  CreatePipelineRequest,
  UpdatePipelineRequest,
} from '../types';
import { useCallback } from 'react';

// Hook for fetching paginated pipelines
export const usePipelines = (
  page = 1,
  limit = 10,
  search?: string,
  tags?: string[]
) => {
  const filters = { page, limit, search, tags };
  
  return useQuery({
    queryKey: queryKeys.pipelines.list(filters),
    queryFn: () => pipelineService.getPipelines(page, limit, search, tags),
    placeholderData: (previousData) => previousData,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Hook for fetching a single pipeline
export const usePipeline = (id: string, enabled = true) => {
  return useQuery({
    queryKey: queryKeys.pipelines.detail(id),
    queryFn: () => pipelineService.getPipeline(id),
    enabled: enabled && !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook for creating a new pipeline
export const useCreatePipeline = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreatePipelineRequest) => pipelineService.createPipeline(data),
    onSuccess: (newPipeline) => {
      // Invalidate and refetch pipelines list
      queryClient.invalidateQueries({
        queryKey: queryKeys.pipelines.lists(),
      });
      
      // Add the new pipeline to cache
      queryClient.setQueryData(
        queryKeys.pipelines.detail(newPipeline.id),
        newPipeline
      );
    },
  });
};

// Hook for updating a pipeline
export const useUpdatePipeline = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePipelineRequest }) =>
      pipelineService.updatePipeline(id, data),
    onSuccess: (updatedPipeline, variables) => {
      // Update the pipeline in cache
      queryClient.setQueryData(
        queryKeys.pipelines.detail(variables.id),
        updatedPipeline
      );
      
      // Invalidate pipelines list to reflect changes
      queryClient.invalidateQueries({
        queryKey: queryKeys.pipelines.lists(),
      });
    },
  });
};

// Hook for deleting a pipeline
export const useDeletePipeline = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => pipelineService.deletePipeline(id),
    onSuccess: (_, deletedId) => {
      // Remove from cache
      queryClient.removeQueries({
        queryKey: queryKeys.pipelines.detail(deletedId),
      });
      
      // Invalidate pipelines list
      queryClient.invalidateQueries({
        queryKey: queryKeys.pipelines.lists(),
      });
    },
  });
};

// Hook for executing a pipeline
export const useExecutePipeline = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: any }) =>
      pipelineService.executePipeline(id, input),
    onSuccess: (result, variables) => {
      // Optionally cache execution results
      const executionCacheKey = [...queryKeys.pipelines.executions(variables.id), variables.input];
      queryClient.setQueryData(executionCacheKey, result);
    },
  });
};

// Hook for duplicating a pipeline
export const useDuplicatePipeline = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name?: string }) =>
      pipelineService.duplicatePipeline(id, name),
    onSuccess: (duplicatedPipeline) => {
      // Add duplicated pipeline to cache
      queryClient.setQueryData(
        queryKeys.pipelines.detail(duplicatedPipeline.id),
        duplicatedPipeline
      );
      
      // Invalidate pipelines list
      queryClient.invalidateQueries({
        queryKey: queryKeys.pipelines.lists(),
      });
    },
  });
};

// Hook for validating a pipeline
export const useValidatePipeline = () => {
  return useMutation({
    mutationFn: (pipeline: Partial<Pipeline>) => 
      pipelineService.validatePipeline(pipeline),
  });
};

// Hook for getting pipeline execution history
export const usePipelineExecutions = (pipelineId: string, enabled = true) => {
  return useQuery({
    queryKey: queryKeys.pipelines.executions(pipelineId),
    queryFn: () => pipelineService.getPipelineExecutions(pipelineId),
    enabled: enabled && !!pipelineId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Hook for getting pipeline metrics
export const usePipelineMetrics = (id: string, days = 30, enabled = true) => {
  return useQuery({
    queryKey: [...queryKeys.pipelines.detail(id), 'metrics', { days }],
    queryFn: () => pipelineService.getPipelineMetrics(id, days),
    enabled: enabled && !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook for exporting pipeline
export const useExportPipeline = () => {
  return useMutation({
    mutationFn: ({ id, format }: { id: string; format: 'json' | 'yaml' }) =>
      pipelineService.exportPipeline(id, format),
  });
};

// Hook for importing pipelines
export const useImportPipelines = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (file: File) => pipelineService.importPipelines(file),
    onSuccess: () => {
      // Invalidate pipelines list to show imported pipelines
      queryClient.invalidateQueries({
        queryKey: queryKeys.pipelines.lists(),
      });
    },
  });
};

// Utility hook for pipeline operations
export const usePipelineOperations = () => {
  const createMutation = useCreatePipeline();
  const updateMutation = useUpdatePipeline();
  const deleteMutation = useDeletePipeline();
  const executeMutation = useExecutePipeline();
  const duplicateMutation = useDuplicatePipeline();
  const validateMutation = useValidatePipeline();
  
  return {
    create: createMutation.mutate,
    update: updateMutation.mutate,
    delete: deleteMutation.mutate,
    execute: executeMutation.mutate,
    duplicate: duplicateMutation.mutate,
    validate: validateMutation.mutate,
    
    // Loading states
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isExecuting: executeMutation.isPending,
    isDuplicating: duplicateMutation.isPending,
    isValidating: validateMutation.isPending,
    
    // Error states
    createError: createMutation.error,
    updateError: updateMutation.error,
    deleteError: deleteMutation.error,
    executeError: executeMutation.error,
    duplicateError: duplicateMutation.error,
    validateError: validateMutation.error,
  };
};

// Hook for optimistic pipeline updates
export const useOptimisticPipelineUpdate = () => {
  const queryClient = useQueryClient();
  
  const optimisticUpdate = useCallback(
    (id: string, updater: (oldData: Pipeline) => Pipeline) => {
      const queryKey = queryKeys.pipelines.detail(id);
      const previousData = queryClient.getQueryData(queryKey);
      
      if (previousData) {
        queryClient.setQueryData(queryKey, updater(previousData as Pipeline));
      }
      
      return () => {
        // Rollback function
        if (previousData) {
          queryClient.setQueryData(queryKey, previousData);
        }
      };
    },
    [queryClient]
  );
  
  return optimisticUpdate;
};