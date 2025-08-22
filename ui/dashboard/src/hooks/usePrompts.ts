import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { promptService } from '../services/PromptService';
import { queryKeys, cacheUtils } from './queryClient';
import {
  Prompt,
  CreatePromptRequest,
  UpdatePromptRequest,
  TestPromptRequest,
  PaginatedResponse,
  TestResultResponse,
} from '../types';
import { useCallback } from 'react';

// Hook for fetching paginated prompts
export const usePrompts = (
  page = 1,
  limit = 10,
  search?: string,
  tags?: string[],
  taskType?: string
) => {
  const filters = { page, limit, search, tags, taskType };
  
  return useQuery({
    queryKey: queryKeys.prompts.list(filters),
    queryFn: () => promptService.getPrompts(page, limit, search, tags),
    placeholderData: (previousData) => previousData, // Keep previous data while fetching new page
    staleTime: 2 * 60 * 1000, // 2 minutes for list data
  });
};

// Hook for fetching a single prompt
export const usePrompt = (id: string, enabled = true) => {
  return useQuery({
    queryKey: queryKeys.prompts.detail(id),
    queryFn: () => promptService.getPrompt(id),
    enabled: enabled && !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes for detail data
  });
};

// Hook for fetching prompt versions
export const usePromptVersions = (promptId: string, enabled = true) => {
  return useQuery({
    queryKey: queryKeys.prompts.versions(promptId),
    queryFn: () => promptService.getPromptVersions(promptId),
    enabled: enabled && !!promptId,
    staleTime: 10 * 60 * 1000, // 10 minutes for version history
  });
};

// Hook for creating a new prompt
export const useCreatePrompt = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreatePromptRequest) => promptService.createPrompt(data),
    onSuccess: (newPrompt) => {
      // Invalidate and refetch prompts list
      cacheUtils.invalidatePrompts();
      
      // Add the new prompt to cache
      queryClient.setQueryData(
        queryKeys.prompts.detail(newPrompt.id),
        newPrompt
      );
    },
  });
};

// Hook for updating a prompt
export const useUpdatePrompt = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePromptRequest }) =>
      promptService.updatePrompt(id, data),
    onSuccess: (updatedPrompt, variables) => {
      // Update the prompt in cache
      queryClient.setQueryData(
        queryKeys.prompts.detail(variables.id),
        updatedPrompt
      );
      
      // Invalidate prompts list to reflect changes
      queryClient.invalidateQueries({
        queryKey: queryKeys.prompts.lists(),
      });
    },
  });
};

// Hook for deleting a prompt
export const useDeletePrompt = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => promptService.deletePrompt(id),
    onSuccess: (_, deletedId) => {
      // Remove from cache
      cacheUtils.removePrompt(deletedId);
      
      // Invalidate prompts list
      cacheUtils.invalidatePrompts();
    },
  });
};

// Hook for comparing two prompt versions
export const usePromptComparison = (
  promptId: string,
  versionA: string,
  versionB: string,
  options?: { enabled?: boolean }
) => {
  return useQuery({
    queryKey: [...queryKeys.prompts.all, 'comparison', promptId, versionA, versionB],
    queryFn: () => promptService.compareVersions(promptId, versionA, versionB),
    enabled: options?.enabled ?? (!!promptId && !!versionA && !!versionB),
    staleTime: 10 * 60 * 1000, // 10 minutes for comparison data
  });
};

// Hook for fetching prompt test history
export const usePromptTestHistory = (promptId: string, enabled = true) => {
  return useQuery({
    queryKey: [...queryKeys.prompts.detail(promptId), 'testHistory'],
    queryFn: () => promptService.getTestHistory(promptId),
    enabled: enabled && !!promptId,
    staleTime: 5 * 60 * 1000, // 5 minutes for test history
  });
};

// Hook for testing a prompt with specific inputs
export const useTestPrompt = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, testData }: { id: string; testData: TestPromptRequest }) =>
      promptService.testPrompt(id, testData),
    onSuccess: (result, variables) => {
      // Optionally cache test results
      const testCacheKey = [...queryKeys.prompts.tests(variables.id), variables.testData];
      queryClient.setQueryData(testCacheKey, result);
    },
  });
};

// Hook for duplicating a prompt
export const useDuplicatePrompt = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name?: string }) =>
      promptService.duplicatePrompt(id, name),
    onSuccess: (duplicatedPrompt) => {
      // Add duplicated prompt to cache
      queryClient.setQueryData(
        queryKeys.prompts.detail(duplicatedPrompt.id),
        duplicatedPrompt
      );
      
      // Invalidate prompts list
      cacheUtils.invalidatePrompts();
    },
  });
};

// Hook for restoring a prompt version
export const useRestorePromptVersion = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ promptId, version }: { promptId: string; version: string }) =>
      promptService.restorePromptVersion(promptId, version),
    onSuccess: (restoredPrompt, variables) => {
      // Update prompt in cache
      queryClient.setQueryData(
        queryKeys.prompts.detail(variables.promptId),
        restoredPrompt
      );
      
      // Invalidate versions to reflect the new active version
      queryClient.invalidateQueries({
        queryKey: queryKeys.prompts.versions(variables.promptId),
      });
      
      // Invalidate prompts list
      cacheUtils.invalidatePrompts();
    },
  });
};

// Hook for getting prompt metrics
export const usePromptMetrics = (id: string, days = 30, enabled = true) => {
  return useQuery({
    queryKey: [...queryKeys.prompts.detail(id), 'metrics', { days }],
    queryFn: () => promptService.getPromptMetrics(id, days),
    enabled: enabled && !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook for getting prompt tags
export const usePromptTags = () => {
  return useQuery({
    queryKey: [...queryKeys.prompts.all, 'tags'],
    queryFn: () => promptService.getPromptTags(),
    staleTime: 15 * 60 * 1000, // 15 minutes for tags
  });
};

// Hook for validating prompt data
export const useValidatePrompt = () => {
  return useMutation({
    mutationFn: (prompt: Partial<Prompt>) => promptService.validatePrompt(prompt),
  });
};

// Hook for exporting prompt
export const useExportPrompt = () => {
  return useMutation({
    mutationFn: ({ id, format }: { id: string; format: 'json' | 'yaml' }) =>
      promptService.exportPrompt(id, format),
  });
};

// Hook for importing prompts
export const useImportPrompts = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (file: File) => promptService.importPrompts(file),
    onSuccess: () => {
      // Invalidate prompts list to show imported prompts
      cacheUtils.invalidatePrompts();
    },
  });
};

// Utility hook for prompt operations
export const usePromptOperations = () => {
  const createMutation = useCreatePrompt();
  const updateMutation = useUpdatePrompt();
  const deleteMutation = useDeletePrompt();
  const testMutation = useTestPrompt();
  const duplicateMutation = useDuplicatePrompt();
  const restoreMutation = useRestorePromptVersion();
  
  return {
    create: createMutation.mutate,
    update: updateMutation.mutate,
    delete: deleteMutation.mutate,
    test: testMutation.mutate,
    duplicate: duplicateMutation.mutate,
    restore: restoreMutation.mutate,
    
    // Loading states
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isTesting: testMutation.isPending,
    isDuplicating: duplicateMutation.isPending,
    isRestoring: restoreMutation.isPending,
    
    // Error states
    createError: createMutation.error,
    updateError: updateMutation.error,
    deleteError: deleteMutation.error,
    testError: testMutation.error,
    duplicateError: duplicateMutation.error,
    restoreError: restoreMutation.error,
  };
};

// Hook for optimistic updates
export const useOptimisticPromptUpdate = () => {
  const queryClient = useQueryClient();
  
  const optimisticUpdate = useCallback(
    (id: string, updater: (oldData: Prompt) => Prompt) => {
      const queryKey = queryKeys.prompts.detail(id);
      const previousData = queryClient.getQueryData(queryKey);
      
      if (previousData) {
        queryClient.setQueryData(queryKey, updater(previousData as Prompt));
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