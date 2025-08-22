import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@mui/material';
import '@testing-library/jest-dom';
import PromptList from '../PromptList';
import { lightPromptPilotTheme } from '../../../theme/theme';
import { Prompt } from '../../../types/Prompt';

// Mock the usePrompts hook
jest.mock('../../../hooks/usePrompts', () => ({
  usePrompts: jest.fn(),
}));

const mockUsePrompts = require('../../../hooks/usePrompts').usePrompts;

// Mock data
const mockPrompts = {
  items: [
    {
      id: '1',
      name: 'Test Prompt 1',
      description: 'Test description 1',
      task_type: 'text_generation',
      tags: ['test', 'example'],
      version_info: {
        version: '1.0.0',
        created_at: '2024-01-01T00:00:00Z',
        created_by: 'test-user',
        is_active: true,
        status: 'PUBLISHED',
        author: 'Test User',
        updated_at: '2024-01-01T00:00:00Z',
      },
      messages: [],
      input_variables: {},
      model_provider: 'openai',
      model_name: 'gpt-3.5-turbo',
      parameters: {},
      test_cases: [],
      evaluation_metrics: {},
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
    {
      id: '2',
      name: 'Test Prompt 2',
      description: 'Test description 2',
      task_type: 'summarization',
      tags: ['summary'],
      version_info: {
        version: '2.0.0',
        created_at: '2024-01-02T00:00:00Z',
        created_by: 'test-user-2',
        is_active: true,
        status: 'DRAFT',
        author: 'Test User 2',
        updated_at: '2024-01-02T00:00:00Z',
      },
      messages: [],
      input_variables: {},
      model_provider: 'anthropic',
      model_name: 'claude-3',
      parameters: {},
      test_cases: [],
      evaluation_metrics: {},
      created_at: '2024-01-02T00:00:00Z',
      updated_at: '2024-01-02T00:00:00Z',
    },
  ] as Prompt[],
  total: 2,
  page: 1,
  size: 10,
};

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={lightPromptPilotTheme}>
        {children}
      </ThemeProvider>
    </QueryClientProvider>
  );
};

// Mock props
const mockProps = {
  selectedPromptId: '',
  onPromptSelect: jest.fn(),
  onEditPrompt: jest.fn(),
  onTestPrompt: jest.fn(),
  onDuplicate: jest.fn(),
  onDelete: jest.fn(),
};

describe('PromptList Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePrompts.mockReturnValue({
      data: mockPrompts,
      isLoading: false,
      error: null,
    });
  });

  it('renders without crashing', () => {
    render(
      <TestWrapper>
        <PromptList {...mockProps} />
      </TestWrapper>
    );
    
    expect(screen.getByRole('textbox', { name: /search prompts/i })).toBeInTheDocument();
  });

  it('displays prompts in table format', () => {
    render(
      <TestWrapper>
        <PromptList {...mockProps} />
      </TestWrapper>
    );

    expect(screen.getByText('Test Prompt 1')).toBeInTheDocument();
    expect(screen.getByText('Test Prompt 2')).toBeInTheDocument();
    expect(screen.getByText('Test description 1')).toBeInTheDocument();
    expect(screen.getByText('Test description 2')).toBeInTheDocument();
  });

  it('filters prompts based on search input', async () => {
    render(
      <TestWrapper>
        <PromptList {...mockProps} />
      </TestWrapper>
    );

    const searchInput = screen.getByRole('textbox', { name: /search prompts/i });
    fireEvent.change(searchInput, { target: { value: 'Test Prompt 1' } });

    await waitFor(() => {
      expect(screen.getByText('Test Prompt 1')).toBeInTheDocument();
      expect(screen.queryByText('Test Prompt 2')).not.toBeInTheDocument();
    });
  });

  it('filters prompts by task type', async () => {
    render(
      <TestWrapper>
        <PromptList {...mockProps} />
      </TestWrapper>
    );

    const searchInput = screen.getByRole('textbox', { name: /search prompts/i });
    fireEvent.change(searchInput, { target: { value: 'summarization' } });

    await waitFor(() => {
      expect(screen.getByText('Test Prompt 2')).toBeInTheDocument();
      expect(screen.queryByText('Test Prompt 1')).not.toBeInTheDocument();
    });
  });

  it('calls onPromptSelect when prompt row is clicked', () => {
    render(
      <TestWrapper>
        <PromptList {...mockProps} />
      </TestWrapper>
    );

    const promptRow = screen.getByText('Test Prompt 1').closest('tr');
    fireEvent.click(promptRow!);

    expect(mockProps.onPromptSelect).toHaveBeenCalledWith(mockPrompts.items[0]);
  });

  it('opens context menu when more actions button is clicked', async () => {
    render(
      <TestWrapper>
        <PromptList {...mockProps} />
      </TestWrapper>
    );

    const moreButtons = screen.getAllByRole('button', { name: /more/i });
    fireEvent.click(moreButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Edit')).toBeInTheDocument();
      expect(screen.getByText('Test')).toBeInTheDocument();
      expect(screen.getByText('Duplicate')).toBeInTheDocument();
      expect(screen.getByText('Delete')).toBeInTheDocument();
    });
  });

  it('calls appropriate callback when context menu items are clicked', async () => {
    render(
      <TestWrapper>
        <PromptList {...mockProps} />
      </TestWrapper>
    );

    const moreButtons = screen.getAllByRole('button', { name: /more/i });
    fireEvent.click(moreButtons[0]);

    await waitFor(() => {
      const editButton = screen.getByText('Edit');
      fireEvent.click(editButton);
    });

    expect(mockProps.onEditPrompt).toHaveBeenCalledWith(mockPrompts.items[0]);
  });

  it('displays loading state', () => {
    mockUsePrompts.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    });

    render(
      <TestWrapper>
        <PromptList {...mockProps} />
      </TestWrapper>
    );

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('displays error state', () => {
    const errorMessage = 'Failed to load prompts';
    mockUsePrompts.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error(errorMessage),
    });

    render(
      <TestWrapper>
        <PromptList {...mockProps} />
      </TestWrapper>
    );

    expect(screen.getByText(/error loading prompts/i)).toBeInTheDocument();
  });

  it('displays empty state when no prompts', () => {
    mockUsePrompts.mockReturnValue({
      data: { items: [], total: 0, page: 1, size: 10 },
      isLoading: false,
      error: null,
    });

    render(
      <TestWrapper>
        <PromptList {...mockProps} />
      </TestWrapper>
    );

    expect(screen.getByText(/no api keys configured/i)).toBeInTheDocument();
  });

  it('handles pagination controls', () => {
    render(
      <TestWrapper>
        <PromptList {...mockProps} />
      </TestWrapper>
    );

    const pagination = screen.getByRole('navigation');
    expect(pagination).toBeInTheDocument();
  });

  it('displays status chips with correct colors', () => {
    render(
      <TestWrapper>
        <PromptList {...mockProps} />
      </TestWrapper>
    );

    expect(screen.getByText('PUBLISHED')).toBeInTheDocument();
    expect(screen.getByText('DRAFT')).toBeInTheDocument();
  });

  it('displays tags for each prompt', () => {
    render(
      <TestWrapper>
        <PromptList {...mockProps} />
      </TestWrapper>
    );

    expect(screen.getByText('test')).toBeInTheDocument();
    expect(screen.getByText('example')).toBeInTheDocument();
    expect(screen.getByText('summary')).toBeInTheDocument();
  });

  it('highlights selected prompt', () => {
    const selectedProps = {
      ...mockProps,
      selectedPromptId: '1',
    };

    render(
      <TestWrapper>
        <PromptList {...selectedProps} />
      </TestWrapper>
    );

    const selectedRow = screen.getByText('Test Prompt 1').closest('tr');
    expect(selectedRow).toHaveClass('Mui-selected');
  });
});