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
  prompt_id: string;
  version: string;
  changelog?: string;
  content_snapshot: Record<string, any>;
  created_at: string;
  created_by?: string;
  is_active: boolean;
  tags: string[];
  commit_message?: string;
  parent_version_id?: string;
  branch_name?: string;
  is_merge?: boolean;
  changes_summary?: string;
  content?: string;
  model?: string;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  notes?: string;
  status?: string;
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

// Version Comparison Types
export interface VersionComparisonDifference {
  field: string;
  version1: any;
  version2: any;
  type: 'added' | 'removed' | 'modified';
  diff?: string[];
}

export interface VersionComparisonSummary {
  total_changes: number;
  added_fields: number;
  removed_fields: number;
  modified_fields: number;
  field_statistics: {
    messages: { added: number; modified: number; removed: number };
    parameters: { added: number; modified: number; removed: number };
    input_variables: { added: number; modified: number; removed: number };
    other_fields: { added: number; modified: number; removed: number };
  };
}

export interface VersionComparisonResponse {
  version_a: PromptVersion;
  version_b: PromptVersion;
  differences: VersionComparisonDifference[];
  summary: VersionComparisonSummary;
}
