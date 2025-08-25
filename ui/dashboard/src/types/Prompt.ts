export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
  priority?: number;
}

export interface TestCase {
  id: string;
  name: string;
  input_variables: Record<string, any>;
  expected_output?: string;
  actual_output?: string;
  status?: 'pending' | 'running' | 'passed' | 'failed';
  inputs?: Record<string, any>;
  expected_outputs?: string;
  test_type?: string;
}

export interface TestResult {
  test_case_id: string;
  output: string;
  execution_time: number;
  success: boolean;
  error?: string;
  cost?: number;
}

export interface PromptVersion {
  id: string;
  version: string;
  created_at: string;
  created_by: string;
  changelog?: string;
  is_active: boolean;
  updated_at?: string;
  status?: string;
  author?: string;
  commit_ref?: string;
  commit_message?: string;
  tags: string[];
  parent_version_id?: string;
  branch_name?: string;
}

export interface Prompt {
  id: string;
  name: string;
  description: string;
  task_type: string;
  tags: string[];
  developer_notes?: string;
  version_info: PromptVersion;
  messages: Message[];
  input_variables: Record<string, any>;
  model_provider: string;
  model_name: string;
  parameters: Record<string, any>;
  test_cases: TestCase[];
  evaluation_metrics: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface CreatePromptRequest {
  name: string;
  description: string;
  task_type: string;
  tags?: string[];
  developer_notes?: string;
  messages: Message[];
  input_variables?: Record<string, any>;
  model_provider: string;
  model_name: string;
  parameters?: Record<string, any>;
}

export interface UpdatePromptRequest {
  name?: string;
  description?: string;
  task_type?: string;
  tags?: string[];
  developer_notes?: string;
  messages?: Message[];
  input_variables?: Record<string, any>;
  model_provider?: string;
  model_name?: string;
  parameters?: Record<string, any>;
}

export interface TestData {
  input_variables: Record<string, any>;
  test_case_id?: string;
}

export interface TestPromptRequest {
  prompt_id: string;
  input_variables: Record<string, any>;
  test_case_id?: string;
}

export interface TestResultResponse {
  success: boolean;
  output: string;
  execution_time: number;
  cost?: number;
  error?: string;
  timestamp: string;
}

export interface TestPromptRequest {
  prompt_id: string;
  input_variables: Record<string, any>;
  test_case_id?: string;
}

export interface TestResultResponse {
  success: boolean;
  output: string;
  execution_time: number;
  cost?: number;
  error?: string;
  timestamp: string;
}