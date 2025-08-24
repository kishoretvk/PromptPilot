import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { promptService } from '../PromptService';
import { apiClient } from '../api';
import { CreatePromptRequest, UpdatePromptRequest, TestPromptRequest } from '../../types';

// Mock the API client
vi.mock('../api');

const mockApiClient = vi.mocked(apiClient);

describe('PromptService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getPrompts', () => {
    it('should fetch prompts with default parameters', async () => {
      const mockResponse = {
        data: {
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
        }
      };

      mockApiClient.get.mockResolvedValue(mockResponse);

      const result = await promptService.getPrompts();

      expect(mockApiClient.get).toHaveBeenCalledWith('/prompts', {
        params: { page: 1, limit: 10 }
      });
      expect(result).toEqual(mockResponse.data);
    });

    it('should fetch prompts with custom parameters', async () => {
      const mockResponse = {
        data: {
          items: [],
          total: 0,
          page: 2,
          limit: 20,
          pages: 0
        }
      };

      mockApiClient.get.mockResolvedValue(mockResponse);

      await promptService.getPrompts(2, 20, 'search term', ['tag1', 'tag2']);

      expect(mockApiClient.get).toHaveBeenCalledWith('/prompts', {
        params: {
          page: 2,
          limit: 20,
          search: 'search term',
          tags: 'tag1,tag2'
        }
      });
    });

    it('should handle API errors', async () => {
      const errorMessage = 'Network error';
      mockApiClient.get.mockRejectedValue(new Error(errorMessage));

      await expect(promptService.getPrompts()).rejects.toThrow(errorMessage);
    });
  });

  describe('getPrompt', () => {
    it('should fetch a single prompt by ID', async () => {
      const mockPrompt = {
        id: '1',
        name: 'Test Prompt',
        description: 'A test prompt',
        content: 'Test content {{variable}}',
        tags: ['test'],
        task_type: 'completion',
        status: 'active',
        version: '1.0.0',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        author: 'test-user'
      };

      mockApiClient.get.mockResolvedValue({ data: mockPrompt });

      const result = await promptService.getPrompt('1');

      expect(mockApiClient.get).toHaveBeenCalledWith('/prompts/1');
      expect(result).toEqual(mockPrompt);
    });

    it('should handle not found error', async () => {
      mockApiClient.get.mockRejectedValue({
        response: { status: 404, data: { message: 'Prompt not found' } }
      });

      await expect(promptService.getPrompt('nonexistent')).rejects.toThrow();
    });
  });

  describe('createPrompt', () => {
    it('should create a new prompt', async () => {
      const createRequest: CreatePromptRequest = {
        name: 'New Prompt',
        description: 'A new test prompt',
        content: 'New prompt content {{input}}',
        tags: ['new', 'test'],
        task_type: 'completion'
      };

      const mockCreatedPrompt = {
        id: '2',
        ...createRequest,
        status: 'draft',
        version: '0.1.0',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        author: 'current-user'
      };

      mockApiClient.post.mockResolvedValue({ data: mockCreatedPrompt });

      const result = await promptService.createPrompt(createRequest);

      expect(mockApiClient.post).toHaveBeenCalledWith('/prompts', createRequest);
      expect(result).toEqual(mockCreatedPrompt);
    });

    it('should handle validation errors', async () => {
      const createRequest: CreatePromptRequest = {
        name: '',
        description: '',
        content: '',
        tags: [],
        task_type: 'completion'
      };

      mockApiClient.post.mockRejectedValue({
        response: {
          status: 400,
          data: {
            message: 'Validation error',
            errors: {
              name: 'Name is required',
              content: 'Content is required'
            }
          }
        }
      });

      await expect(promptService.createPrompt(createRequest)).rejects.toThrow();
    });
  });

  describe('updatePrompt', () => {
    it('should update an existing prompt', async () => {
      const updateRequest: UpdatePromptRequest = {
        name: 'Updated Prompt',
        description: 'Updated description',
        content: 'Updated content {{variable}}',
        tags: ['updated', 'test']
      };

      const mockUpdatedPrompt = {
        id: '1',
        ...updateRequest,
        task_type: 'completion',
        status: 'active',
        version: '1.1.0',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
        author: 'test-user'
      };

      mockApiClient.put.mockResolvedValue({ data: mockUpdatedPrompt });

      const result = await promptService.updatePrompt('1', updateRequest);

      expect(mockApiClient.put).toHaveBeenCalledWith('/prompts/1', updateRequest);
      expect(result).toEqual(mockUpdatedPrompt);
    });
  });

  describe('deletePrompt', () => {
    it('should delete a prompt', async () => {
      mockApiClient.delete.mockResolvedValue({ data: { message: 'Prompt deleted' } });

      await promptService.deletePrompt('1');

      expect(mockApiClient.delete).toHaveBeenCalledWith('/prompts/1');
    });

    it('should handle delete errors', async () => {
      mockApiClient.delete.mockRejectedValue({
        response: { status: 403, data: { message: 'Access denied' } }
      });

      await expect(promptService.deletePrompt('1')).rejects.toThrow();
    });
  });

  describe('testPrompt', () => {
    it('should test a prompt with input data', async () => {
      const testRequest: TestPromptRequest = {
        inputs: {
          variable: 'test value',
          input: 'test input'
        },
        options: {
          temperature: 0.7,
          max_tokens: 150
        }
      };

      const mockTestResult = {
        id: 'test-1',
        prompt_id: '1',
        inputs: testRequest.inputs,
        output: 'Generated test response',
        success: true,
        execution_time: 1500,
        token_usage: {
          prompt_tokens: 20,
          completion_tokens: 15,
          total_tokens: 35
        },
        created_at: '2024-01-01T00:00:00Z'
      };

      mockApiClient.post.mockResolvedValue({ data: mockTestResult });

      const result = await promptService.testPrompt('1', testRequest);

      expect(mockApiClient.post).toHaveBeenCalledWith('/prompts/1/test', testRequest);
      expect(result).toEqual(mockTestResult);
    });

    it('should handle test execution errors', async () => {
      const testRequest: TestPromptRequest = {
        inputs: { variable: 'test' },
        options: {}
      };

      mockApiClient.post.mockRejectedValue({
        response: {
          status: 500,
          data: { message: 'Execution failed', error: 'API key invalid' }
        }
      });

      await expect(promptService.testPrompt('1', testRequest)).rejects.toThrow();
    });
  });

  describe('getPromptVersions', () => {
    it('should fetch prompt version history', async () => {
      const mockVersions = [
        {
          id: 'v1',
          prompt_id: '1',
          version: '1.0.0',
          content: 'Original content',
          created_at: '2024-01-01T00:00:00Z',
          author: 'user1',
          status: 'published'
        },
        {
          id: 'v2',
          prompt_id: '1',
          version: '1.1.0',
          content: 'Updated content',
          created_at: '2024-01-02T00:00:00Z',
          author: 'user2',
          status: 'draft'
        }
      ];

      mockApiClient.get.mockResolvedValue({ data: mockVersions });

      const result = await promptService.getPromptVersions('1');

      expect(mockApiClient.get).toHaveBeenCalledWith('/prompts/1/versions');
      expect(result).toEqual(mockVersions);
    });
  });

  describe('compareVersions', () => {
    it('should compare two prompt versions', async () => {
      const mockComparison = {
        version_a: {
          id: 'v1',
          version: '1.0.0',
          content: 'Original content'
        },
        version_b: {
          id: 'v2',
          version: '1.1.0',
          content: 'Updated content'
        },
        differences: [
          {
            type: 'modified',
            field: 'content',
            old_value: 'Original content',
            new_value: 'Updated content'
          }
        ]
      };

      mockApiClient.get.mockResolvedValue({ data: mockComparison });

      const result = await promptService.compareVersions('1', 'v1', 'v2');

      expect(mockApiClient.get).toHaveBeenCalledWith('/prompts/1/versions/compare', {
        params: { version_a: 'v1', version_b: 'v2' }
      });
      expect(result).toEqual(mockComparison);
    });
  });

  describe('duplicatePrompt', () => {
    it('should duplicate a prompt with optional name', async () => {
      const mockDuplicatedPrompt = {
        id: '3',
        name: 'Copy of Test Prompt',
        description: 'A test prompt',
        content: 'Test content',
        tags: ['test'],
        task_type: 'completion',
        status: 'draft',
        version: '0.1.0',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        author: 'current-user'
      };

      mockApiClient.post.mockResolvedValue({ data: mockDuplicatedPrompt });

      const result = await promptService.duplicatePrompt('1', 'Custom Copy Name');

      expect(mockApiClient.post).toHaveBeenCalledWith('/prompts/1/duplicate', {
        name: 'Custom Copy Name'
      });
      expect(result).toEqual(mockDuplicatedPrompt);
    });
  });

  describe('restorePromptVersion', () => {
    it('should restore a prompt to a specific version', async () => {
      const mockRestoredPrompt = {
        id: '1',
        name: 'Test Prompt',
        description: 'A test prompt',
        content: 'Restored content',
        tags: ['test'],
        task_type: 'completion',
        status: 'active',
        version: '1.2.0',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-03T00:00:00Z',
        author: 'test-user'
      };

      mockApiClient.post.mockResolvedValue({ data: mockRestoredPrompt });

      const result = await promptService.restorePromptVersion('1', 'v1');

      expect(mockApiClient.post).toHaveBeenCalledWith('/prompts/1/versions/v1/restore');
      expect(result).toEqual(mockRestoredPrompt);
    });
  });
});