import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { PromptList } from '../PromptList';
import { theme } from '../../../theme';
import { usePrompts } from '../../../hooks/usePrompts';

// Mock the hooks
vi.mock('../../../hooks/usePrompts');

// Mock data
const mockPrompts = {
  items: [
    {
      id: '1',
      name: 'Test Prompt 1',
      description: 'A test prompt for unit testing',
      content: 'This is a test prompt: {{variable}}',
      tags: ['test', 'unit'],
      task_type: 'completion',
      status: 'active',
      version: '1.0.0',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      author: 'test-user',
      usage_count: 5,
      success_rate: 95.5,
      avg_response_time: 150
    },
    {
      id: '2',
      name: 'Test Prompt 2',
      description: 'Another test prompt',
      content: 'Another test prompt: {{input}}',
      tags: ['test', 'integration'],
      task_type: 'chat',
      status: 'draft',
      version: '0.1.0',
      created_at: '2024-01-02T00:00:00Z',
      updated_at: '2024-01-02T00:00:00Z',
      author: 'test-user-2',
      usage_count: 0,
      success_rate: 0,
      avg_response_time: 0
    }
  ],
  total: 2,
  page: 1,
  limit: 10,
  pages: 1
};

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
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

describe('PromptList Component', () => {
  const mockUsePrompts = vi.mocked(usePrompts);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state correctly', () => {
    mockUsePrompts.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      isFetching: true,
      isPending: true,
      isError: false,
      refetch: vi.fn(),
    } as any);

    render(
      <TestWrapper>
        <PromptList />
      </TestWrapper>
    );

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders prompts correctly', async () => {
    mockUsePrompts.mockReturnValue({
      data: mockPrompts,
      isLoading: false,
      error: null,
      isFetching: false,
      isPending: false,
      isError: false,
      refetch: vi.fn(),
    } as any);

    render(
      <TestWrapper>
        <PromptList />
      </TestWrapper>
    );

    // Check if prompt names are rendered
    expect(screen.getByText('Test Prompt 1')).toBeInTheDocument();
    expect(screen.getByText('Test Prompt 2')).toBeInTheDocument();

    // Check if descriptions are rendered
    expect(screen.getByText('A test prompt for unit testing')).toBeInTheDocument();
    expect(screen.getByText('Another test prompt')).toBeInTheDocument();

    // Check if tags are rendered
    expect(screen.getByText('test')).toBeInTheDocument();
    expect(screen.getByText('unit')).toBeInTheDocument();
    expect(screen.getByText('integration')).toBeInTheDocument();

    // Check if status chips are rendered
    expect(screen.getByText('active')).toBeInTheDocument();
    expect(screen.getByText('draft')).toBeInTheDocument();
  });

  it('renders error state correctly', () => {
    const errorMessage = 'Failed to fetch prompts';
    mockUsePrompts.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error(errorMessage),
      isFetching: false,
      isPending: false,
      isError: true,
      refetch: vi.fn(),
    } as any);

    render(
      <TestWrapper>
        <PromptList />
      </TestWrapper>
    );

    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('renders empty state correctly', () => {
    mockUsePrompts.mockReturnValue({
      data: { items: [], total: 0, page: 1, limit: 10, pages: 0 },
      isLoading: false,
      error: null,
      isFetching: false,
      isPending: false,
      isError: false,
      refetch: vi.fn(),
    } as any);

    render(
      <TestWrapper>
        <PromptList />
      </TestWrapper>
    );

    expect(screen.getByText(/no prompts found/i)).toBeInTheDocument();
  });

  it('handles search functionality', async () => {
    const mockRefetch = vi.fn();
    mockUsePrompts.mockReturnValue({
      data: mockPrompts,
      isLoading: false,
      error: null,
      isFetching: false,
      isPending: false,
      isError: false,
      refetch: mockRefetch,
    } as any);

    render(
      <TestWrapper>
        <PromptList />
      </TestWrapper>
    );

    // Find search input
    const searchInput = screen.getByPlaceholderText(/search prompts/i);
    expect(searchInput).toBeInTheDocument();

    // Type in search input
    fireEvent.change(searchInput, { target: { value: 'test search' } });

    // Wait for debounced search
    await waitFor(() => {
      expect(mockUsePrompts).toHaveBeenCalledWith(
        1, 10, 'test search', undefined, undefined
      );
    }, { timeout: 1000 });
  });

  it('handles filter by task type', async () => {
    mockUsePrompts.mockReturnValue({
      data: mockPrompts,
      isLoading: false,
      error: null,
      isFetching: false,
      isPending: false,
      isError: false,
      refetch: vi.fn(),
    } as any);

    render(
      <TestWrapper>
        <PromptList />
      </TestWrapper>
    );

    // Find task type filter
    const taskTypeFilter = screen.getByLabelText(/task type/i);
    fireEvent.click(taskTypeFilter);

    // Select completion option
    const completionOption = await screen.findByText('Completion');
    fireEvent.click(completionOption);

    await waitFor(() => {
      expect(mockUsePrompts).toHaveBeenCalledWith(
        1, 10, '', undefined, 'completion'
      );
    });
  });

  it('handles pagination', async () => {
    mockUsePrompts.mockReturnValue({
      data: { ...mockPrompts, pages: 3, page: 1 },
      isLoading: false,
      error: null,
      isFetching: false,
      isPending: false,
      isError: false,
      refetch: vi.fn(),
    } as any);

    render(
      <TestWrapper>
        <PromptList />
      </TestWrapper>
    );

    // Find pagination controls
    const nextPageButton = screen.getByLabelText(/go to next page/i);
    fireEvent.click(nextPageButton);

    await waitFor(() => {
      expect(mockUsePrompts).toHaveBeenCalledWith(
        2, 10, '', undefined, undefined
      );
    });
  });

  it('opens prompt actions menu', async () => {
    mockUsePrompts.mockReturnValue({
      data: mockPrompts,
      isLoading: false,
      error: null,
      isFetching: false,
      isPending: false,
      isError: false,
      refetch: vi.fn(),
    } as any);

    render(
      <TestWrapper>
        <PromptList />
      </TestWrapper>
    );

    // Find and click the actions menu button for the first prompt
    const actionButtons = screen.getAllByLabelText(/more actions/i);
    fireEvent.click(actionButtons[0]);

    // Check if menu options appear
    await waitFor(() => {
      expect(screen.getByText('Edit')).toBeInTheDocument();
      expect(screen.getByText('Test')).toBeInTheDocument();
      expect(screen.getByText('Duplicate')).toBeInTheDocument();
      expect(screen.getByText('Delete')).toBeInTheDocument();
    });
  });

  it('handles create new prompt', () => {
    mockUsePrompts.mockReturnValue({
      data: mockPrompts,
      isLoading: false,
      error: null,
      isFetching: false,
      isPending: false,
      isError: false,
      refetch: vi.fn(),
    } as any);

    render(
      <TestWrapper>
        <PromptList />
      </TestWrapper>
    );

    // Find and click create prompt button
    const createButton = screen.getByText(/create prompt/i);
    fireEvent.click(createButton);

    // This would typically trigger navigation or modal opening
    // The exact behavior depends on the onCreatePrompt implementation
  });

  it('displays correct metrics', () => {
    mockUsePrompts.mockReturnValue({
      data: mockPrompts,
      isLoading: false,
      error: null,
      isFetching: false,
      isPending: false,
      isError: false,
      refetch: vi.fn(),
    } as any);

    render(
      <TestWrapper>
        <PromptList />
      </TestWrapper>
    );

    // Check if usage metrics are displayed
    expect(screen.getByText('5')).toBeInTheDocument(); // usage_count
    expect(screen.getByText('95.5%')).toBeInTheDocument(); // success_rate
    expect(screen.getByText('150ms')).toBeInTheDocument(); // avg_response_time
  });

  it('applies correct styling to status chips', () => {
    mockUsePrompts.mockReturnValue({
      data: mockPrompts,
      isLoading: false,
      error: null,
      isFetching: false,
      isPending: false,
      isError: false,
      refetch: vi.fn(),
    } as any);

    render(
      <TestWrapper>
        <PromptList />
      </TestWrapper>
    );

    const activeChip = screen.getByText('active');
    const draftChip = screen.getByText('draft');

    expect(activeChip).toHaveClass('MuiChip-colorSuccess');
    expect(draftChip).toHaveClass('MuiChip-colorWarning');
  });
});