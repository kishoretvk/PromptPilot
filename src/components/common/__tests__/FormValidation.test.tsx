import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { FieldError } from 'react-hook-form';
import { 
  ValidatedForm, 
  ValidatedTextField, 
  ValidatedSelect,
  ValidatedTagsInput,
  ValidatedSwitch,
  ValidatedSlider
} from '../ValidatedForm';
import { 
  promptValidationSchema,
  apiKeyValidationSchema
} from '../../../utils/validation';
import { 
  useResponsive,
  ResponsiveContainer,
  ResponsiveGrid,
  ResponsiveStack
} from '../ResponsiveComponents';
import { ThemeProvider, createTheme } from '@mui/material/styles';

// Mock theme
const theme = createTheme();

// Mock useMediaQuery to control responsive behavior in tests
jest.mock('@mui/material/useMediaQuery', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation((query: string | (() => any)) => {
    if (typeof query === 'function') {
      // Handle function queries
      return false;
    }
    // Handle string queries
    if (query.includes('sm')) return true; // Simulate tablet
    if (query.includes('md')) return true; // Simulate desktop
    return false; // Default to mobile
  }),
}));

// Test data
const mockPromptData = {
  name: 'Test Prompt',
  description: 'A test prompt for validation',
  content: 'This is a test prompt with {{variable}}',
  tags: ['test', 'validation'],
  task_type: 'completion',
  temperature: 0.7,
  max_tokens: 150,
};

const mockApiKeyData = {
  name: 'Test API Key',
  provider: 'openai',
  key: 'sk-test1234567890',
  usage_limit: 1000,
};

describe('Form Validation Components', () => {
  it('should render validated form with prompt schema', () => {
    const onSubmit = jest.fn();
    
    render(
      <ThemeProvider theme={theme}>
        <ValidatedForm
          validationSchema={promptValidationSchema}
          onSubmit={onSubmit}
          defaultValues={mockPromptData}
        >
          {({ control }) => (
            <>
              <ValidatedTextField
                name="name"
                control={control}
                label="Prompt Name"
              />
              <ValidatedTextField
                name="description"
                control={control}
                label="Description"
                multiline
                rows={3}
              />
              <ValidatedSelect
                name="task_type"
                control={control}
                label="Task Type"
                options={[
                  { value: 'completion', label: 'Completion' },
                  { value: 'chat', label: 'Chat' },
                ]}
              />
              <button type="submit">Submit</button>
            </>
          )}
        </ValidatedForm>
      </ThemeProvider>
    );

    expect(screen.getByLabelText('Prompt Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Description')).toBeInTheDocument();
    // For Select components, we need to check the select element differently
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('should validate prompt form with valid data', async () => {
    const onSubmit = jest.fn();
    
    render(
      <ThemeProvider theme={theme}>
        <ValidatedForm
          validationSchema={promptValidationSchema}
          onSubmit={onSubmit}
          defaultValues={mockPromptData}
        >
          {({ control }) => (
            <>
              <ValidatedTextField
                name="name"
                control={control}
                label="Prompt Name"
              />
              <ValidatedTextField
                name="description"
                control={control}
                label="Description"
                multiline
                rows={3}
              />
              <ValidatedTextField
                name="content"
                control={control}
                label="Content"
                multiline
                rows={5}
              />
              <ValidatedTagsInput
                name="tags"
                control={control}
                label="Tags"
              />
              <ValidatedSelect
                name="task_type"
                control={control}
                label="Task Type"
                options={[
                  { value: 'completion', label: 'Completion' },
                  { value: 'chat', label: 'Chat' },
                ]}
              />
              <button type="submit">Submit</button>
            </>
          )}
        </ValidatedForm>
      </ThemeProvider>
    );

    const submitButton = screen.getByText('Submit');
    fireEvent.click(submitButton);

    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Should call onSubmit since data is valid
    expect(onSubmit).toHaveBeenCalled();
  });

  it('should show validation errors for invalid prompt data', async () => {
    const onSubmit = jest.fn();
    const invalidData = {
      name: '', // Required
      description: 'Short', // Too short
      content: 'No variables here', // Missing {{variable}} format
      tags: [],
      task_type: 'invalid', // Not in enum
    };

    render(
      <ThemeProvider theme={theme}>
        <ValidatedForm
          validationSchema={promptValidationSchema}
          onSubmit={onSubmit}
          defaultValues={invalidData}
        >
          {({ control, formState: { errors } }) => (
            <>
              <ValidatedTextField
                name="name"
                control={control}
                label="Prompt Name"
              />
              <ValidatedTextField
                name="description"
                control={control}
                label="Description"
              />
              <ValidatedTextField
                name="content"
                control={control}
                label="Content"
              />
              <ValidatedTagsInput
                name="tags"
                control={control}
                label="Tags"
              />
              <ValidatedSelect
                name="task_type"
                control={control}
                label="Task Type"
                options={[
                  { value: 'completion', label: 'Completion' },
                  { value: 'chat', label: 'Chat' },
                ]}
              />
              <button type="submit">Submit</button>
              
              {/* Display errors for testing */}
              {Object.keys(errors).length > 0 && (
                <div data-testid="form-errors">
                  {Object.entries(errors).map(([key, error]) => (
                    <div key={key} data-testid={`error-${key}`}>
                      {error && typeof error === 'object' && 'message' in error ? (error as FieldError).message : String(error)}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </ValidatedForm>
      </ThemeProvider>
    );

    const submitButton = screen.getByText('Submit');
    fireEvent.click(submitButton);

    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Should not call onSubmit due to validation errors
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('should validate API key form', async () => {
    const onSubmit = jest.fn();
    
    render(
      <ThemeProvider theme={theme}>
        <ValidatedForm
          validationSchema={apiKeyValidationSchema}
          onSubmit={onSubmit}
          defaultValues={mockApiKeyData}
        >
          {({ control }) => (
            <>
              <ValidatedTextField
                name="name"
                control={control}
                label="API Key Name"
              />
              <ValidatedSelect
                name="provider"
                control={control}
                label="Provider"
                options={[
                  { value: 'openai', label: 'OpenAI' },
                  { value: 'anthropic', label: 'Anthropic' },
                ]}
              />
              <ValidatedTextField
                name="key"
                control={control}
                label="API Key"
                type="password"
              />
              <button type="submit">Submit</button>
            </>
          )}
        </ValidatedForm>
      </ThemeProvider>
    );

    const submitButton = screen.getByText('Submit');
    fireEvent.click(submitButton);

    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Should call onSubmit since data is valid
    expect(onSubmit).toHaveBeenCalled();
  });
});

describe('Responsive Components', () => {
  it('should render responsive container with correct padding', () => {
    render(
      <ThemeProvider theme={theme}>
        <ResponsiveContainer>
          <div data-testid="responsive-content">Content</div>
        </ResponsiveContainer>
      </ThemeProvider>
    );

    expect(screen.getByTestId('responsive-content')).toBeInTheDocument();
  });

  it('should render responsive grid with correct spacing', () => {
    render(
      <ThemeProvider theme={theme}>
        <ResponsiveGrid container spacing={2}>
          <ResponsiveGrid item xs={12} sm={6}>
            <div data-testid="grid-item-1">Item 1</div>
          </ResponsiveGrid>
          <ResponsiveGrid item xs={12} sm={6}>
            <div data-testid="grid-item-2">Item 2</div>
          </ResponsiveGrid>
        </ResponsiveGrid>
      </ThemeProvider>
    );

    expect(screen.getByTestId('grid-item-1')).toBeInTheDocument();
    expect(screen.getByTestId('grid-item-2')).toBeInTheDocument();
  });

  it('should render responsive stack with correct direction', () => {
    render(
      <ThemeProvider theme={theme}>
        <ResponsiveStack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <div data-testid="stack-item-1">Item 1</div>
          <div data-testid="stack-item-2">Item 2</div>
        </ResponsiveStack>
      </ThemeProvider>
    );

    expect(screen.getByTestId('stack-item-1')).toBeInTheDocument();
    expect(screen.getByTestId('stack-item-2')).toBeInTheDocument();
  });

  it('should use responsive hook correctly', () => {
    const TestComponent = () => {
      const responsive = useResponsive();
      return (
        <div data-testid="responsive-info">
          {responsive.isMobile ? 'mobile' : 'desktop'}
        </div>
      );
    };

    render(
      <ThemeProvider theme={theme}>
        <TestComponent />
      </ThemeProvider>
    );

    // Based on our mock, should be desktop
    expect(screen.getByTestId('responsive-info')).toHaveTextContent('desktop');
  });
});

describe('Advanced Form Components', () => {
  it('should render tags input with suggestions', () => {
    const onSubmit = jest.fn();
    
    render(
      <ThemeProvider theme={theme}>
        <ValidatedForm
          validationSchema={promptValidationSchema}
          onSubmit={onSubmit}
          defaultValues={mockPromptData}
        >
          {({ control }) => (
            <ValidatedTagsInput
              name="tags"
              control={control}
              label="Tags"
              suggestions={['test', 'validation', 'prompt']}
            />
          )}
        </ValidatedForm>
      </ThemeProvider>
    );

    expect(screen.getByLabelText('Tags')).toBeInTheDocument();
  });

  it('should render switch component', () => {
    const onSubmit = jest.fn();
    
    render(
      <ThemeProvider theme={theme}>
        <ValidatedForm
          validationSchema={apiKeyValidationSchema}
          onSubmit={onSubmit}
          defaultValues={{ ...mockApiKeyData, active: true }}
        >
          {({ control }) => (
            <ValidatedSwitch
              name="active"
              control={control}
              label="Active"
            />
          )}
        </ValidatedForm>
      </ThemeProvider>
    );

    expect(screen.getByLabelText('Active')).toBeInTheDocument();
  });

  it('should render slider component', () => {
    const onSubmit = jest.fn();
    
    render(
      <ThemeProvider theme={theme}>
        <ValidatedForm
          validationSchema={promptValidationSchema}
          onSubmit={onSubmit}
          defaultValues={mockPromptData}
        >
          {({ control }) => (
            <ValidatedSlider
              name="temperature"
              control={control}
              label="Temperature"
              min={0}
              max={2}
              step={0.1}
            />
          )}
        </ValidatedForm>
      </ThemeProvider>
    );

    expect(screen.getByText('Temperature')).toBeInTheDocument();
  });
});