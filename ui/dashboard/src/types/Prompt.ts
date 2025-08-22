export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface TestCase {
  id: string;
  name: string;
  input_variables: Record<string, any>;
  expected_output?: string;
  actual_output?: string;
  status?: 'pending' | 'running' | 'passed' | 'failed';
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
  version: string;
  created_at: string;
  created_by: string;
  changelog?: string;
  is_active: boolean;
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