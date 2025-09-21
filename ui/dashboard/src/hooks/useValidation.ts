import { useMutation } from '@tanstack/react-query';

interface ValidationRequest {
  content: string;
  prompt_type?: string;
  context?: Record<string, any>;
}

interface ValidationIssue {
  type: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  suggestion?: string;
}

interface ValidationResult {
  is_valid: boolean;
  overall_score: number;
  issues: ValidationIssue[];
  passed_checks: string[];
  failed_checks: string[];
  recommendations: string[];
  processing_time: number;
}

// API functions
const validatePromptAPI = async (request: ValidationRequest): Promise<ValidationResult> => {
  const response = await fetch('/api/validation/validate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`Validation failed: ${response.statusText}`);
  }

  return response.json();
};

const validateBatchAPI = async (requests: ValidationRequest[]): Promise<ValidationResult[]> => {
  const response = await fetch('/api/validation/validate/batch', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requests),
  });

  if (!response.ok) {
    throw new Error(`Batch validation failed: ${response.statusText}`);
  }

  return response.json();
};

export const useValidation = () => {
  const validateMutation = useMutation<ValidationResult, Error, ValidationRequest>({
    mutationFn: validatePromptAPI,
  });

  const validateBatchMutation = useMutation<ValidationResult[], Error, ValidationRequest[]>({
    mutationFn: validateBatchAPI,
  });

  const validatePrompt = async (request: ValidationRequest): Promise<ValidationResult> => {
    return validateMutation.mutateAsync(request);
  };

  const validateBatch = async (requests: ValidationRequest[]): Promise<ValidationResult[]> => {
    return validateBatchMutation.mutateAsync(requests);
  };

  return {
    // Single prompt validation
    validatePrompt,
    isLoading: validateMutation.isPending,
    error: validateMutation.error?.message || null,
    lastResult: validateMutation.data,

    // Batch validation
    validateBatch,
    isBatchLoading: validateBatchMutation.isPending,
    batchError: validateBatchMutation.error?.message || null,

    // Reset functions
    reset: () => {
      validateMutation.reset();
    },
    resetBatch: () => {
      validateBatchMutation.reset();
    },
  };
};