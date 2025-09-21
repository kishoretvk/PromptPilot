import { useMutation } from '@tanstack/react-query';

interface ABTestRequest {
  original_prompt: Record<string, any>;
  refined_prompt: Record<string, any>;
  test_duration?: number;
  sample_size?: number;
}

interface ABTestStatus {
  test_id: string;
  status: string;
  progress: number;
  samples_collected: number;
  target_samples: number;
  estimated_time_remaining?: number;
  start_time: string;
  last_updated: string;
}

interface ABTestResults {
  test_id: string;
  is_complete: boolean;
  winner: 'original' | 'refined' | null;
  significant_improvement: boolean;
  improvement_percentage: number;
  confidence_level: number;
  total_samples: number;
  original_wins: number;
  original_win_rate: number;
  original_samples: number;
  original_avg_score?: number;
  original_std_dev?: number;
  original_ci_lower?: number;
  original_ci_upper?: number;
  refined_wins: number;
  refined_win_rate: number;
  refined_samples: number;
  refined_avg_score?: number;
  refined_std_dev?: number;
  refined_ci_lower?: number;
  refined_ci_upper?: number;
  p_value?: number;
  effect_size?: number;
  test_type?: string;
  test_duration: number;
  completed_at: string;
}

// API functions
const startABTestAPI = async (request: ABTestRequest): Promise<{ test_id: string }> => {
  const response = await fetch('/api/testing/start-ab-test', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`Failed to start A/B test: ${response.statusText}`);
  }

  return response.json();
};

const stopABTestAPI = async (testId: string): Promise<void> => {
  const response = await fetch(`/api/testing/stop-ab-test/${testId}`, {
    method: 'POST',
  });

  if (!response.ok) {
    throw new Error(`Failed to stop A/B test: ${response.statusText}`);
  }
};

const getABTestStatusAPI = async (testId: string): Promise<ABTestStatus> => {
  const response = await fetch(`/api/testing/ab-test-status/${testId}`);

  if (!response.ok) {
    throw new Error(`Failed to get test status: ${response.statusText}`);
  }

  return response.json();
};

const getABTestResultsAPI = async (testId: string): Promise<ABTestResults> => {
  const response = await fetch(`/api/testing/ab-test-results/${testId}`);

  if (!response.ok) {
    throw new Error(`Failed to get test results: ${response.statusText}`);
  }

  return response.json();
};

export const useABTesting = () => {
  const startTestMutation = useMutation<{ test_id: string }, Error, ABTestRequest>({
    mutationFn: startABTestAPI,
  });

  const stopTestMutation = useMutation<void, Error, string>({
    mutationFn: stopABTestAPI,
  });

  const statusMutation = useMutation<ABTestStatus, Error, string>({
    mutationFn: getABTestStatusAPI,
  });

  const resultsMutation = useMutation<ABTestResults, Error, string>({
    mutationFn: getABTestResultsAPI,
  });

  const startTest = async (request: ABTestRequest): Promise<{ test_id: string }> => {
    return startTestMutation.mutateAsync(request);
  };

  const stopTest = async (testId: string): Promise<void> => {
    return stopTestMutation.mutateAsync(testId);
  };

  const getTestStatus = async (testId: string): Promise<ABTestStatus> => {
    return statusMutation.mutateAsync(testId);
  };

  const getTestResults = async (testId: string): Promise<ABTestResults> => {
    return resultsMutation.mutateAsync(testId);
  };

  return {
    // Test management
    startTest,
    isStarting: startTestMutation.isPending,
    startError: startTestMutation.error?.message || null,
    startResult: startTestMutation.data,

    stopTest,
    isStopping: stopTestMutation.isPending,
    stopError: stopTestMutation.error?.message || null,

    getTestStatus,
    isLoadingStatus: statusMutation.isPending,
    statusError: statusMutation.error?.message || null,
    testStatus: statusMutation.data,

    getTestResults,
    isLoadingResults: resultsMutation.isPending,
    resultsError: resultsMutation.error?.message || null,
    testResults: resultsMutation.data,

    // Reset functions
    resetStart: () => startTestMutation.reset(),
    resetStop: () => stopTestMutation.reset(),
    resetStatus: () => statusMutation.reset(),
    resetResults: () => resultsMutation.reset(),
  };
};