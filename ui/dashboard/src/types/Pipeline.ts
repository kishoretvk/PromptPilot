export interface PipelineStep {
  id: string;
  name: string;
  type: 'prompt' | 'transform' | 'condition' | 'loop' | 'parallel';
  prompt_id?: string;
  configuration: Record<string, any>;
  input_mapping?: Record<string, string>;
  output_mapping?: Record<string, string>;
  next_steps?: string[];
  condition?: string;
  position?: {
    x: number;
    y: number;
  };
}

export interface Pipeline {
  id: string;
  name: string;
  description: string;
  steps: PipelineStep[];
  error_strategy: 'fail_fast' | 'continue' | 'retry';
  created_at: string;
  updated_at: string;
  version: string;
  tags: string[];
}

export interface CreatePipelineRequest {
  name: string;
  description: string;
  steps?: PipelineStep[];
  error_strategy?: 'fail_fast' | 'continue' | 'retry';
  tags?: string[];
}

export interface UpdatePipelineRequest {
  name?: string;
  description?: string;
  steps?: PipelineStep[];
  error_strategy?: 'fail_fast' | 'continue' | 'retry';
  tags?: string[];
}

export interface PipelineResult {
  pipeline_id: string;
  execution_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  start_time: string;
  end_time?: string;
  input_data: Record<string, any>;
  output_data?: Record<string, any>;
  step_results: StepResult[];
  error?: string;
  total_cost?: number;
}

export interface StepResult {
  step_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  start_time: string;
  end_time?: string;
  input_data: Record<string, any>;
  output_data?: Record<string, any>;
  error?: string;
  cost?: number;
}

export interface ValidationResult {
  is_valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  step_id: string;
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ValidationWarning {
  step_id: string;
  field: string;
  message: string;
}