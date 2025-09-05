import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { usePrompts, useCreatePrompt, useUpdatePrompt, useDeletePrompt } from '../usePrompts';
import { promptService } from '../../services/PromptService';

// Mock the prompt service
jest.mock('../../services/PromptService');

const mockPromptService = promptService as jest.Mocked<typeof promptService>;

// Test wrapper for React Query
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
};

describe('usePrompts Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('usePrompts', () => {
    it('should fetch prompts successfully', async () => {
      const mockData = {
        items: [
          {
            id: '1',
            name: 'Test Prompt',
            description: 'A test prompt',
            content: 'Test content',
            tags: ['test'],
            task_type: 'completion',
            status: 'active',
            version: '1.0.0',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
            author: 'test-user'
          }
        ],
        total: 1,
        page: 1,
        limit: 10,
        pages: 1
      };

      mockPromptService.getPrompts.mockResolvedValue(mockData);

      const { result } = renderHook(() => usePrompts(1, 10), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockData);
      expect(mockPromptService.getPrompts).toHaveBeenCalledWith(1, 10, undefined, undefined);
    });

    it('should handle search and filters', async () => {
      const mockData = {
        items: [],
        total: 0,
        page: 1,
        limit: 10,
        pages: 0
      };

      mockPromptService.getPrompts.mockResolvedValue(mockData);

      const { result } = renderHook(
        () => usePrompts(1, 10, 'search term', ['tag1'], 'completion'),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockPromptService.getPrompts).toHaveBeenCalledWith(
        1, 10, 'search term', ['tag1']
      );
    });

    it('should handle fetch errors', async () => {
      const errorMessage = 'Failed to fetch prompts';
      mockPromptService.getPrompts.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => usePrompts(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error?.message).toBe(errorMessage);
    });

    it('should use placeholder data during refetch', async () => {
      const initialData = {
        items: [{ id: '1', name: 'Initial' }],
        total: 1,
        page: 1,
        limit: 10,
        pages: 1
      };

      const newData = {
        items: [{ id: '2', name: 'Updated' }],
        total: 1,
        page: 1,
        limit: 10,
        pages: 1
      };

      mockPromptService.getPrompts
        .mockResolvedValueOnce(initialData)
        .mockResolvedValueOnce(newData);

      const { result, rerender } = renderHook(
        ({ page }) => usePrompts(page, 10),
        {
          wrapper: createWrapper(),
          initialProps: { page: 1 }
        }
      );

      // Wait for initial data
      await waitFor(() => {
        expect(result.current.data).toEqual(initialData);
      });

      // Trigger refetch with new page
      rerender({ page: 2 });

      // Should have placeholder data during fetch
      expect(result.current.data).toEqual(initialData);

      // Wait for new data
      await waitFor(() => {
        expect(result.current.data).toEqual(newData);
      });
    });
  });

  describe('useCreatePrompt', () => {
    it('should create a prompt successfully', async () => {
      const createRequest = {
        name: 'New Prompt',
        description: 'A new prompt',
        content: 'New content',
        tags: ['new'],
        task_type: 'completion' as const
      };

      const createdPrompt = {
        id: '2',
        ...createRequest,
        status: 'draft' as const,
        version: '0.1.0',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        author: 'user'
      };

      mockPromptService.createPrompt.mockResolvedValue(createdPrompt);

      const { result } = renderHook(() => useCreatePrompt(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(createRequest);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(createdPrompt);
      expect(mockPromptService.createPrompt).toHaveBeenCalledWith(createRequest);
    });

    it('should handle creation errors', async () => {
      const createRequest = {
        name: 'Invalid Prompt',
        description: '',
        content: '',
        tags: [],
        task_type: 'completion' as const
      };

      const error = new Error('Validation failed');
      mockPromptService.createPrompt.mockRejectedValue(error);

      const { result } = renderHook(() => useCreatePrompt(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(createRequest);

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(error);
    });
  });

  describe('useUpdatePrompt', () => {
    it('should update a prompt successfully', async () => {
      const updateRequest = {
        name: 'Updated Prompt',
        description: 'Updated description',
        content: 'Updated content',
        tags: ['updated']
      };

      const updatedPrompt = {
        id: '1',
        ...updateRequest,
        task_type: 'completion' as const,
        status: 'active' as const,
        version: '1.1.0',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
        author: 'user'
      };

      mockPromptService.updatePrompt.mockResolvedValue(updatedPrompt);

      const { result } = renderHook(() => useUpdatePrompt(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ id: '1', data: updateRequest });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(updatedPrompt);
      expect(mockPromptService.updatePrompt).toHaveBeenCalledWith('1', updateRequest);
    });
  });

  describe('useDeletePrompt', () => {
    it('should delete a prompt successfully', async () => {
      mockPromptService.deletePrompt.mockResolvedValue(undefined);

      const { result } = renderHook(() => useDeletePrompt(), {
        wrapper: createWrapper(),
      });

      result.current.mutate('1');

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockPromptService.deletePrompt).toHaveBeenCalledWith('1');
    });

    it('should handle deletion errors', async () => {
      const error = new Error('Access denied');
      mockPromptService.deletePrompt.mockRejectedValue(error);

      const { result } = renderHook(() => useDeletePrompt(), {
        wrapper: createWrapper(),
      });

      result.current.mutate('1');

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(error);
    });
  });

  describe('Cache Management', () => {
    it('should invalidate queries after successful creation', async () => {
      const queryClient = new QueryClient();
      const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

      const createRequest = {
        name: 'New Prompt',
        description: 'A new prompt',
        content: 'New content',
        tags: ['new'],
        task_type: 'completion' as const
      };

      const createdPrompt = {
        id: '2',
        ...createRequest,
        status: 'draft' as const,
        version: '0.1.0',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        author: 'user'
      };

      mockPromptService.createPrompt.mockResolvedValue(createdPrompt);

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      );

      const { result } = renderHook(() => useCreatePrompt(), { wrapper });

      result.current.mutate(createRequest);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Should invalidate prompts list queries
      expect(invalidateSpy).toHaveBeenCalled();
    });

    it('should update cache after successful update', async () => {
      const queryClient = new QueryClient();
      const setQueryDataSpy = jest.spyOn(queryClient, 'setQueryData');

      const updateRequest = {
        name: 'Updated Prompt',
        description: 'Updated description'
      };

      const updatedPrompt = {
        id: '1',
        name: 'Updated Prompt',
        description: 'Updated description',
        content: 'Original content',
        tags: ['test'],
        task_type: 'completion' as const,
        status: 'active' as const,
        version: '1.1.0',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
        author: 'user'
      };

      mockPromptService.updatePrompt.mockResolvedValue(updatedPrompt);

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      );

      const { result } = renderHook(() => useUpdatePrompt(), { wrapper });

      result.current.mutate({ id: '1', data: updateRequest });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Should update the specific prompt in cache
      expect(setQueryDataSpy).toHaveBeenCalled();
    });
  });
});