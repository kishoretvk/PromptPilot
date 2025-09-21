import { useMutation } from '@tanstack/react-query';

interface RefinementRequest {
  prompt_data: Record<string, any>;
  max_iterations?: number;
  quality_threshold?: number;
  preferred_provider?: string;
  preferred_model?: string;
}

interface QualityScore {
  quality_score: {
    overall_score: number;
    clarity: number;
    specificity: number;
    context_usage: number;
    task_alignment: number;
    safety_score: number;
    issues: string[];
    suggestions: string[];
  };
  analysis_timestamp: string;
  recommendations: string[];
}

interface AISuggestion {
  id: string;
  type: string;
  title: string;
  description: string;
  suggested_change: string;
  confidence_score: number;
  category: string;
  impact_level: 'high' | 'medium' | 'low';
}

interface RefinementResult {
  original_prompt: Record<string, any>;
  refined_prompt: Record<string, any>;
  iterations: number;
  quality_improvement: number;
  status: string;
  processing_time: number;
  suggestions_applied: AISuggestion[];
  ab_test_triggered: boolean;
  error_message?: string;
}

interface ExampleGenerationRequest {
  original_prompt: Record<string, any>;
  refined_prompt: Record<string, any>;
}

interface RefinementExample {
  id: string;
  title: string;
  description: string;
  original_prompt: Record<string, any>;
  refined_prompt: Record<string, any>;
  improvement_type: string;
  quality_metrics: Record<string, any>;
}

// API functions
const refinePromptAPI = async (request: RefinementRequest): Promise<RefinementResult> => {
  const response = await fetch('/api/ai-refinement/refine', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`Refinement failed: ${response.statusText}`);
  }

  return response.json();
};

const analyzeQualityAPI = async (promptData: Record<string, any>): Promise<QualityScore> => {
  const response = await fetch('/api/ai-refinement/analyze-quality', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prompt_data: promptData }),
  });

  if (!response.ok) {
    throw new Error(`Analysis failed: ${response.statusText}`);
  }

  return response.json();
};

const generateExamplesAPI = async (request: ExampleGenerationRequest): Promise<RefinementExample[]> => {
  const response = await fetch('/api/ai-refinement/generate-examples', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`Example generation failed: ${response.statusText}`);
  }

  return response.json();
};

const getProvidersAPI = async () => {
  const response = await fetch('/api/ai-refinement/providers');

  if (!response.ok) {
    throw new Error(`Failed to get providers: ${response.statusText}`);
  }

  return response.json();
};

export const useAIRefinement = () => {
  const refineMutation = useMutation<RefinementResult, Error, RefinementRequest>({
    mutationFn: refinePromptAPI,
  });

  const analysisMutation = useMutation<QualityScore, Error, Record<string, any>>({
    mutationFn: analyzeQualityAPI,
  });

  const examplesMutation = useMutation<RefinementExample[], Error, ExampleGenerationRequest>({
    mutationFn: generateExamplesAPI,
  });

  const providersMutation = useMutation({
    mutationFn: getProvidersAPI,
  });

  const refinePrompt = async (request: RefinementRequest): Promise<RefinementResult> => {
    return refineMutation.mutateAsync(request);
  };

  const analyzeQuality = async (promptData: Record<string, any>): Promise<QualityScore> => {
    return analysisMutation.mutateAsync(promptData);
  };

  const generateExamples = async (request: ExampleGenerationRequest): Promise<RefinementExample[]> => {
    return examplesMutation.mutateAsync(request);
  };

  const getProviders = async () => {
    return providersMutation.mutateAsync();
  };

  return {
    // Prompt refinement
    refinePrompt,
    isRefining: refineMutation.isPending,
    refinementError: refineMutation.error?.message || null,
    lastRefinement: refineMutation.data,

    // Quality analysis
    analyzeQuality,
    isAnalyzing: analysisMutation.isPending,
    analysisError: analysisMutation.error?.message || null,
    lastAnalysis: analysisMutation.data,

    // Example generation
    generateExamples,
    isGeneratingExamples: examplesMutation.isPending,
    examplesError: examplesMutation.error?.message || null,
    lastExamples: examplesMutation.data,

    // Providers
    getProviders,
    isLoadingProviders: providersMutation.isPending,
    providersError: providersMutation.error?.message || null,
    providers: providersMutation.data,

    // Reset functions
    resetRefinement: () => refineMutation.reset(),
    resetAnalysis: () => analysisMutation.reset(),
    resetExamples: () => examplesMutation.reset(),
    resetProviders: () => providersMutation.reset(),
  };
};