import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { vi, describe, it, expect, beforeEach, beforeAll, afterEach } from 'vitest';
import { PromptManager } from '../PromptManager';
import { theme } from '../../../theme';
import { promptService } from '../../../services/PromptService';

// Mock the entire prompt service
vi.mock('../../../services/PromptService');

const mockPromptService = vi.mocked(promptService);

// Mock data
const mockPrompts = {
  items: [
    {
      id: '1',
      name: 'Marketing Email Template',
      description: 'Generate marketing emails for product launches',
      content: 'Write a marketing email for {{product_name}} targeting {{audience}}. Include key benefits: {{benefits}}',
      tags: ['marketing', 'email', 'template'],
      task_type: 'completion',
      status: 'active',
      version: '1.2.0',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-15T00:00:00Z',
      author: 'marketing-team',
      usage_count: 156,
      success_rate: 94.2,
      avg_response_time: 850
    },
    {
      id: '2',
      name: 'Code Review Assistant',
      description: 'Automated code review and suggestions',
      content: 'Review the following {{language}} code and provide suggestions:\\n\\n{{code}}',
      tags: ['development', 'review', 'assistant'],
      task_type: 'chat',
      status: 'draft',
      version: '0.3.0',
      created_at: '2024-01-10T00:00:00Z',
      updated_at: '2024-01-20T00:00:00Z',
      author: 'dev-team',
      usage_count: 23,
      success_rate: 87.5,
      avg_response_time: 1200
    }
  ],
  total: 2,
  page: 1,
  limit: 10,
  pages: 1
};

const mockTestResult = {
  id: 'test-123',
  prompt_id: '1',
  inputs: {
    product_name: 'SuperWidget Pro',
    audience: 'small business owners',
    benefits: 'increased productivity, cost savings, easy integration'
  },
  output: 'Subject: Boost Your Business with SuperWidget Pro\\n\\nDear Business Owner,\\n\\nAre you looking to increase productivity while saving costs? SuperWidget Pro is designed specifically for small business owners like you...\\n\\nKey Benefits:\\n- Increased productivity\\n- Cost savings\\n- Easy integration\\n\\nTry SuperWidget Pro today!',
  success: true,
  execution_time: 820,
  token_usage: {
    prompt_tokens: 45,
    completion_tokens: 95,
    total_tokens: 140
  },
  created_at: '2024-01-21T12:00:00Z'
};

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ThemeProvider theme={theme}>
          {children}
        </ThemeProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('PromptManager Integration Tests', () => {
  const user = userEvent.setup();

  beforeAll(() => {
    // Mock window.confirm for delete operations
    window.confirm = vi.fn(() => true);
  });

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock implementations
    mockPromptService.getPrompts.mockResolvedValue(mockPrompts);
    mockPromptService.getPrompt.mockImplementation((id) => 
      Promise.resolve(mockPrompts.items.find(p => p.id === id))
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Complete User Workflow', () => {
    it('should allow user to browse, search, and interact with prompts', async () => {
      render(
        <TestWrapper>
          <PromptManager />
        </TestWrapper>
      );

      // 1. Initial load - should show prompts
      await waitFor(() => {
        expect(screen.getByText('Marketing Email Template')).toBeInTheDocument();
        expect(screen.getByText('Code Review Assistant')).toBeInTheDocument();
      });

      // 2. Verify prompt details are displayed
      expect(screen.getByText('Generate marketing emails for product launches')).toBeInTheDocument();
      expect(screen.getByText('156')).toBeInTheDocument(); // usage count
      expect(screen.getByText('94.2%')).toBeInTheDocument(); // success rate

      // 3. Search functionality
      const searchInput = screen.getByPlaceholderText(/search prompts/i);
      await user.type(searchInput, 'marketing');

      await waitFor(() => {
        expect(mockPromptService.getPrompts).toHaveBeenCalledWith(
          1, 10, 'marketing', undefined, undefined
        );
      });

      // 4. Filter by task type
      const taskTypeFilter = screen.getByLabelText(/task type/i);
      await user.click(taskTypeFilter);
      
      const completionOption = screen.getByText('Completion');
      await user.click(completionOption);

      await waitFor(() => {
        expect(mockPromptService.getPrompts).toHaveBeenCalledWith(
          1, 10, 'marketing', undefined, 'completion'
        );
      });

      // 5. Clear search
      await user.clear(searchInput);
      
      await waitFor(() => {
        expect(mockPromptService.getPrompts).toHaveBeenCalledWith(
          1, 10, '', undefined, 'completion'
        );
      });
    });

    it('should allow user to create a new prompt', async () => {
      const newPrompt = {
        id: '3',
        name: 'Customer Support Response',
        description: 'Generate helpful customer support responses',
        content: 'Respond to this customer inquiry: {{inquiry}}\\n\\nTone: {{tone}}',
        tags: ['support', 'customer', 'response'],
        task_type: 'completion',
        status: 'draft',
        version: '0.1.0',
        created_at: '2024-01-21T00:00:00Z',
        updated_at: '2024-01-21T00:00:00Z',
        author: 'current-user',
        usage_count: 0,
        success_rate: 0,
        avg_response_time: 0
      };

      mockPromptService.createPrompt.mockResolvedValue(newPrompt);

      render(
        <TestWrapper>
          <PromptManager />
        </TestWrapper>
      );

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('Marketing Email Template')).toBeInTheDocument();
      });

      // Click create prompt button
      const createButton = screen.getByText(/create prompt/i);
      await user.click(createButton);

      // Fill in the form (assuming a modal or form appears)
      const nameInput = screen.getByLabelText(/prompt name/i);
      const descriptionInput = screen.getByLabelText(/description/i);
      const contentInput = screen.getByLabelText(/content/i);

      await user.type(nameInput, 'Customer Support Response');
      await user.type(descriptionInput, 'Generate helpful customer support responses');
      await user.type(contentInput, 'Respond to this customer inquiry: {{inquiry}}\\n\\nTone: {{tone}}');

      // Add tags
      const tagsInput = screen.getByLabelText(/tags/i);
      await user.type(tagsInput, 'support,customer,response');

      // Select task type
      const taskTypeSelect = screen.getByLabelText(/task type/i);
      await user.click(taskTypeSelect);
      
      const completionOption = screen.getByText('Completion');
      await user.click(completionOption);

      // Save the prompt
      const saveButton = screen.getByText(/save/i);
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockPromptService.createPrompt).toHaveBeenCalledWith({
          name: 'Customer Support Response',
          description: 'Generate helpful customer support responses',
          content: 'Respond to this customer inquiry: {{inquiry}}\\n\\nTone: {{tone}}',
          tags: ['support', 'customer', 'response'],
          task_type: 'completion'
        });
      });
    });

    it('should allow user to test a prompt', async () => {
      mockPromptService.testPrompt.mockResolvedValue(mockTestResult);

      render(
        <TestWrapper>
          <PromptManager />
        </TestWrapper>
      );

      // Wait for prompts to load
      await waitFor(() => {
        expect(screen.getByText('Marketing Email Template')).toBeInTheDocument();
      });

      // Click test button for the first prompt
      const testButtons = screen.getAllByLabelText(/test prompt/i);
      await user.click(testButtons[0]);

      // Fill in test inputs
      const productNameInput = screen.getByLabelText(/product_name/i);
      const audienceInput = screen.getByLabelText(/audience/i);
      const benefitsInput = screen.getByLabelText(/benefits/i);

      await user.type(productNameInput, 'SuperWidget Pro');
      await user.type(audienceInput, 'small business owners');
      await user.type(benefitsInput, 'increased productivity, cost savings, easy integration');

      // Run the test
      const runTestButton = screen.getByText(/run test/i);
      await user.click(runTestButton);

      await waitFor(() => {
        expect(mockPromptService.testPrompt).toHaveBeenCalledWith('1', {
          inputs: {
            product_name: 'SuperWidget Pro',
            audience: 'small business owners',
            benefits: 'increased productivity, cost savings, easy integration'
          },
          options: {}
        });
      });

      // Verify test results are displayed
      await waitFor(() => {
        expect(screen.getByText(/Subject: Boost Your Business/)).toBeInTheDocument();
        expect(screen.getByText('820ms')).toBeInTheDocument(); // execution time
        expect(screen.getByText('140')).toBeInTheDocument(); // total tokens
      });
    });

    it('should handle edit prompt workflow', async () => {
      const updatedPrompt = {
        ...mockPrompts.items[0],
        name: 'Updated Marketing Email Template',
        description: 'Updated description for marketing emails',
        version: '1.3.0',
        updated_at: '2024-01-21T00:00:00Z'
      };

      mockPromptService.updatePrompt.mockResolvedValue(updatedPrompt);

      render(
        <TestWrapper>
          <PromptManager />
        </TestWrapper>
      );

      // Wait for prompts to load
      await waitFor(() => {
        expect(screen.getByText('Marketing Email Template')).toBeInTheDocument();
      });

      // Click edit button for the first prompt
      const editButtons = screen.getAllByLabelText(/edit prompt/i);
      await user.click(editButtons[0]);

      // Update the name and description
      const nameInput = screen.getByDisplayValue('Marketing Email Template');
      const descriptionInput = screen.getByDisplayValue('Generate marketing emails for product launches');

      await user.clear(nameInput);
      await user.type(nameInput, 'Updated Marketing Email Template');

      await user.clear(descriptionInput);
      await user.type(descriptionInput, 'Updated description for marketing emails');

      // Save changes
      const saveButton = screen.getByText(/save changes/i);
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockPromptService.updatePrompt).toHaveBeenCalledWith('1', {
          name: 'Updated Marketing Email Template',
          description: 'Updated description for marketing emails',
          content: mockPrompts.items[0].content,
          tags: mockPrompts.items[0].tags
        });
      });
    });

    it('should handle delete prompt workflow', async () => {
      mockPromptService.deletePrompt.mockResolvedValue(undefined);

      render(
        <TestWrapper>
          <PromptManager />
        </TestWrapper>
      );

      // Wait for prompts to load
      await waitFor(() => {
        expect(screen.getByText('Marketing Email Template')).toBeInTheDocument();
      });

      // Click delete button for the first prompt
      const deleteButtons = screen.getAllByLabelText(/delete prompt/i);
      await user.click(deleteButtons[0]);

      // Confirm deletion (window.confirm is mocked to return true)
      await waitFor(() => {
        expect(mockPromptService.deletePrompt).toHaveBeenCalledWith('1');
      });

      expect(window.confirm).toHaveBeenCalledWith(
        expect.stringContaining('Are you sure you want to delete')
      );
    });

    it('should handle pagination', async () => {
      const page2Data = {
        items: [
          {
            id: '3',
            name: 'Prompt Page 2',
            description: 'Another prompt',
            content: 'Content for page 2',
            tags: ['test'],
            task_type: 'completion',
            status: 'active',
            version: '1.0.0',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
            author: 'user',
            usage_count: 10,
            success_rate: 90,
            avg_response_time: 500
          }
        ],
        total: 3,
        page: 2,
        limit: 10,
        pages: 2
      };

      // Mock first call returns page 1, second call returns page 2
      mockPromptService.getPrompts
        .mockResolvedValueOnce({ ...mockPrompts, total: 3, pages: 2 })
        .mockResolvedValueOnce(page2Data);

      render(
        <TestWrapper>
          <PromptManager />
        </TestWrapper>
      );

      // Wait for initial page to load
      await waitFor(() => {
        expect(screen.getByText('Marketing Email Template')).toBeInTheDocument();
      });

      // Click next page
      const nextPageButton = screen.getByLabelText(/go to next page/i);
      await user.click(nextPageButton);

      await waitFor(() => {
        expect(mockPromptService.getPrompts).toHaveBeenCalledWith(2, 10, '', undefined, undefined);
        expect(screen.getByText('Prompt Page 2')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle fetch errors gracefully', async () => {
      mockPromptService.getPrompts.mockRejectedValue(new Error('Network error'));

      render(
        <TestWrapper>
          <PromptManager />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/Network error/)).toBeInTheDocument();
      });

      // Should show retry button
      const retryButton = screen.getByText(/retry/i);
      expect(retryButton).toBeInTheDocument();
    });

    it('should handle test prompt errors', async () => {
      mockPromptService.testPrompt.mockRejectedValue(new Error('Test execution failed'));

      render(
        <TestWrapper>
          <PromptManager />
        </TestWrapper>
      );

      // Wait for prompts to load
      await waitFor(() => {
        expect(screen.getByText('Marketing Email Template')).toBeInTheDocument();
      });

      // Try to test a prompt
      const testButtons = screen.getAllByLabelText(/test prompt/i);
      await user.click(testButtons[0]);

      const runTestButton = screen.getByText(/run test/i);
      await user.click(runTestButton);

      await waitFor(() => {
        expect(screen.getByText(/Test execution failed/)).toBeInTheDocument();
      });
    });
  });

  describe('Loading States', () => {
    it('should show loading state during initial fetch', () => {
      // Don't resolve the promise immediately
      let resolvePromise: (value: any) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      
      mockPromptService.getPrompts.mockReturnValue(promise);

      render(
        <TestWrapper>
          <PromptManager />
        </TestWrapper>
      );

      expect(screen.getByRole('progressbar')).toBeInTheDocument();

      // Resolve the promise
      resolvePromise!(mockPrompts);
    });

    it('should show loading state during test execution', async () => {
      // Create a delayed promise
      let resolveTest: (value: any) => void;
      const testPromise = new Promise((resolve) => {
        resolveTest = resolve;
      });
      
      mockPromptService.testPrompt.mockReturnValue(testPromise);

      render(
        <TestWrapper>
          <PromptManager />
        </TestWrapper>
      );

      // Wait for prompts to load
      await waitFor(() => {
        expect(screen.getByText('Marketing Email Template')).toBeInTheDocument();
      });

      // Start test
      const testButtons = screen.getAllByLabelText(/test prompt/i);
      await user.click(testButtons[0]);

      const runTestButton = screen.getByText(/run test/i);
      await user.click(runTestButton);

      // Should show loading state
      expect(screen.getByText(/running test/i)).toBeInTheDocument();

      // Resolve test
      resolveTest!(mockTestResult);

      await waitFor(() => {
        expect(screen.getByText(/Subject: Boost Your Business/)).toBeInTheDocument();
      });
    });
  });
});