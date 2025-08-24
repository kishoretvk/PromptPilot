import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@mui/material';
import '@testing-library/jest-dom';
import PromptEditor from '../PromptEditor';
import { lightPromptPilotTheme } from '../../../theme/theme';
import { Prompt } from '../../../types/Prompt';

// Mock hooks
jest.mock('../../../hooks/usePrompts', () => ({
  useCreatePrompt: jest.fn(),
  useUpdatePrompt: jest.fn(),
}));

const mockHooks = require('../../../hooks/usePrompts');

// Test wrapper
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

// Mock prompt data
const mockPrompt: Prompt = {
  id: '1',
  name: 'Test Prompt',
  description: 'Test description',
  task_type: 'text_generation',
  tags: ['test'],
  version_info: {
    version: '1.0.0',
    created_at: '2024-01-01T00:00:00Z',
    created_by: 'test-user',
    is_active: true,
    status: 'DRAFT',
    author: 'Test User',
  },
  messages: [
    {
      role: 'system',
      content: 'You are a helpful assistant.',
      priority: 1,
    },
    {
      role: 'user',
      content: 'Generate a {topic} summary.',
      priority: 2,
    },
  ],
  input_variables: { topic: 'string' },
  model_provider: 'openai',
  model_name: 'gpt-3.5-turbo',
  parameters: {
    temperature: 0.7,
    max_tokens: 1000,
  },
  test_cases: [],
  evaluation_metrics: {},
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

const mockProps = {
  prompt: mockPrompt,
  onSave: jest.fn(),
  onCancel: jest.fn(),
  isReadOnly: false,
};

describe('PromptEditor Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockHooks.useCreatePrompt.mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
    });
    mockHooks.useUpdatePrompt.mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
    });
  });

  it('renders without crashing', () => {
    render(
      <TestWrapper>
        <PromptEditor {...mockProps} />
      </TestWrapper>
    );

    expect(screen.getByLabelText(/prompt name/i)).toBeInTheDocument();
  });

  it('displays prompt data in form fields', () => {
    render(
      <TestWrapper>
        <PromptEditor {...mockProps} />
      </TestWrapper>
    );

    expect(screen.getByDisplayValue('Test Prompt')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test description')).toBeInTheDocument();
    expect(screen.getByDisplayValue('openai')).toBeInTheDocument();
    expect(screen.getByDisplayValue('gpt-3.5-turbo')).toBeInTheDocument();
  });

  it('allows editing form fields when not read-only', () => {
    render(
      <TestWrapper>
        <PromptEditor {...mockProps} />
      </TestWrapper>
    );

    const nameInput = screen.getByLabelText(/prompt name/i);
    fireEvent.change(nameInput, { target: { value: 'Updated Prompt Name' } });

    expect(screen.getByDisplayValue('Updated Prompt Name')).toBeInTheDocument();
  });

  it('disables form fields when read-only', () => {
    const readOnlyProps = { ...mockProps, isReadOnly: true };
    
    render(
      <TestWrapper>
        <PromptEditor {...readOnlyProps} />
      </TestWrapper>
    );

    const nameInput = screen.getByLabelText(/prompt name/i);
    expect(nameInput).toBeDisabled();
  });

  it('displays messages in correct order', () => {
    render(
      <TestWrapper>
        <PromptEditor {...mockProps} />
      </TestWrapper>
    );

    const messages = screen.getAllByText(/system|user/i);
    expect(messages).toHaveLength(2);
  });

  it('allows adding new messages', async () => {
    render(
      <TestWrapper>
        <PromptEditor {...mockProps} />
      </TestWrapper>
    );

    const addButton = screen.getByRole('button', { name: /add message/i });
    fireEvent.click(addButton);

    await waitFor(() => {
      const messages = screen.getAllByText(/system|user|assistant/i);
      expect(messages.length).toBeGreaterThan(2);
    });
  });

  it('allows removing messages', async () => {
    render(
      <TestWrapper>
        <PromptEditor {...mockProps} />
      </TestWrapper>
    );

    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      const messages = screen.getAllByText(/system|user/i);
      expect(messages).toHaveLength(1);
    });
  });

  it('validates required fields', async () => {
    render(
      <TestWrapper>
        <PromptEditor {...mockProps} />
      </TestWrapper>
    );

    const nameInput = screen.getByLabelText(/prompt name/i);
    fireEvent.change(nameInput, { target: { value: '' } });

    const saveButton = screen.getByRole('button', { name: /save/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText(/name is required/i)).toBeInTheDocument();
    });
  });

  it('displays parameter controls for model settings', () => {
    render(
      <TestWrapper>
        <PromptEditor {...mockProps} />
      </TestWrapper>
    );

    expect(screen.getByLabelText(/temperature/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/max tokens/i)).toBeInTheDocument();
  });

  it('allows updating model parameters', () => {
    render(
      <TestWrapper>
        <PromptEditor {...mockProps} />
      </TestWrapper>
    );

    const temperatureSlider = screen.getByLabelText(/temperature/i);
    fireEvent.change(temperatureSlider, { target: { value: '0.9' } });

    expect(screen.getByDisplayValue('0.9')).toBeInTheDocument();
  });

  it('shows input variables section', () => {
    render(
      <TestWrapper>
        <PromptEditor {...mockProps} />
      </TestWrapper>
    );

    expect(screen.getByText(/input variables/i)).toBeInTheDocument();
    expect(screen.getByText('topic')).toBeInTheDocument();
  });

  it('allows adding new input variables', async () => {
    render(
      <TestWrapper>
        <PromptEditor {...mockProps} />
      </TestWrapper>
    );

    const addVariableButton = screen.getByRole('button', { name: /add variable/i });
    fireEvent.click(addVariableButton);

    await waitFor(() => {
      const variableInputs = screen.getAllByLabelText(/variable name/i);
      expect(variableInputs.length).toBeGreaterThan(1);
    });
  });

  it('calls onSave with updated prompt data', async () => {
    const mockMutateAsync = jest.fn().mockResolvedValue(mockPrompt);
    mockHooks.useUpdatePrompt.mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
    });

    render(
      <TestWrapper>
        <PromptEditor {...mockProps} />
      </TestWrapper>
    );

    const nameInput = screen.getByLabelText(/prompt name/i);
    fireEvent.change(nameInput, { target: { value: 'Updated Name' } });

    const saveButton = screen.getByRole('button', { name: /save/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalled();
    });
  });

  it('calls onCancel when cancel button is clicked', () => {
    render(
      <TestWrapper>
        <PromptEditor {...mockProps} />
      </TestWrapper>
    );

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);

    expect(mockProps.onCancel).toHaveBeenCalled();
  });

  it('shows loading state when saving', () => {
    mockHooks.useUpdatePrompt.mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: true,
    });

    render(
      <TestWrapper>
        <PromptEditor {...mockProps} />
      </TestWrapper>
    );

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('allows editing tags', async () => {
    render(
      <TestWrapper>
        <PromptEditor {...mockProps} />
      </TestWrapper>
    );

    const tagsInput = screen.getByLabelText(/tags/i);
    fireEvent.change(tagsInput, { target: { value: 'test, new-tag' } });

    await waitFor(() => {
      expect(screen.getByDisplayValue('test, new-tag')).toBeInTheDocument();
    });
  });

  it('validates message content is not empty', async () => {
    render(
      <TestWrapper>
        <PromptEditor {...mockProps} />
      </TestWrapper>
    );

    const messageContent = screen.getAllByLabelText(/content/i)[0];
    fireEvent.change(messageContent, { target: { value: '' } });

    const saveButton = screen.getByRole('button', { name: /save/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText(/message content is required/i)).toBeInTheDocument();
    });
  });
});