export interface UsageMetrics {
  total_prompts: number;
  total_executions: number;
  total_pipelines: number;
  active_users: number;
  period: string;
  growth_rate: number;
  usage_by_day: DailyUsage[];
  top_prompts: TopPrompt[];
  top_providers: TopProvider[];
  total_tokens?: number;
  success_rate?: number;
  average_response_time?: number;
}

export interface DailyUsage {
  date: string;
  executions: number;
  unique_prompts: number;
  cost: number;
}

export interface TopPrompt {
  prompt_id: string;
  name: string;
  executions: number;
  success_rate: number;
  avg_execution_time: number;
}

export interface TopProvider {
  provider: string;
  executions: number;
  cost: number;
  avg_response_time: number;
}

export interface PerformanceData {
  prompt_performance: PromptPerformance[];
  provider_performance: ProviderPerformance[];
  response_times: ResponseTimeData[];
  success_rates: SuccessRateData[];
}

export interface PromptPerformance {
  prompt_id: string;
  name: string;
  avg_execution_time: number;
  success_rate: number;
  total_executions: number;
  error_rate: number;
  cost_per_execution: number;
}

export interface ProviderPerformance {
  provider: string;
  avg_response_time: number;
  success_rate: number;
  total_requests: number;
  avg_cost: number;
  uptime_percentage: number;
}

export interface ResponseTimeData {
  timestamp: string;
  provider: string;
  response_time: number;
}

export interface SuccessRateData {
  date: string;
  prompt_id: string;
  success_rate: number;
  total_executions: number;
}

export interface CostData {
  total_cost: number;
  cost_by_provider: CostByProvider[];
  cost_by_prompt: CostByPrompt[];
  cost_trend: CostTrend[];
  projected_monthly_cost: number;
}

export interface CostByProvider {
  provider: string;
  cost: number;
  percentage: number;
  requests: number;
}

export interface CostByPrompt {
  prompt_id: string;
  name: string;
  cost: number;
  executions: number;
  cost_per_execution: number;
}

export interface CostTrend {
  date: string;
  cost: number;
  requests: number;
}

export interface AnalyticsFilter {
  date_range: {
    start: string;
    end: string;
  };
  prompt_ids?: string[];
  providers?: string[];
  tags?: string[];
}