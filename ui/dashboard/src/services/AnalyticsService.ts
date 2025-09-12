import { apiClient } from './api';
import {
  UsageMetrics,
  PerformanceData,
  CostData,
  AnalyticsFilter,
} from '../types';

class AnalyticsService {
  private basePath = '/api/v1/analytics';

  async getUsageMetrics(filters?: AnalyticsFilter): Promise<UsageMetrics> {
    try {
      const params = new URLSearchParams();
      if (filters) {
        if (filters.prompt_ids?.length) params.set('prompt_ids', filters.prompt_ids.join(','));
        if (filters.providers?.length) params.set('providers', filters.providers.join(','));
        if (filters.tags?.length) params.set('tags', filters.tags.join(','));
        if (filters.date_range) {
          params.set('start_date', filters.date_range.start);
          params.set('end_date', filters.date_range.end);
        }
      }

      const response = await apiClient.get<UsageMetrics>(`${this.basePath}/usage`, params);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch usage metrics: ${error}`);
    }
  };

  async getPerformanceData(timeRange = '30d', promptIds?: string[]): Promise<PerformanceData> {
    const params: any = { time_range: timeRange };
    if (promptIds?.length) params.prompt_ids = promptIds.join(',');

    const response = await apiClient.get<PerformanceData>(`${this.basePath}/performance`, params);
    return response.data;
  }

  async getCostAnalysis(timeRange = '30d', filters?: AnalyticsFilter): Promise<CostData> {
    const params: any = { time_range: timeRange };
    if (filters) {
      if (filters.prompt_ids?.length) params.prompt_ids = filters.prompt_ids.join(',');
      if (filters.providers?.length) params.providers = filters.providers.join(',');
      if (filters.date_range) {
        params.start_date = filters.date_range.start;
        params.end_date = filters.date_range.end;
      }
    }

    const response = await apiClient.get<CostData>(`${this.basePath}/costs`, params);
    return response.data;
  }

  async getExecutionTrends(timeRange = '30d', granularity = 'day'): Promise<any[]> {
    const response = await apiClient.get<any[]>(`${this.basePath}/trends/executions`, {
      time_range: timeRange,
      granularity,
    });
    return response.data;
  }

  async getErrorAnalysis(timeRange = '30d'): Promise<any> {
    const response = await apiClient.get<any>(`${this.basePath}/errors`, { time_range: timeRange });
    return response.data;
  }

  async getProviderComparison(timeRange = '30d'): Promise<any[]> {
    const response = await apiClient.get<any[]>(`${this.basePath}/providers/comparison`, { time_range: timeRange });
    return response.data;
  }

  async getPromptLeaderboard(timeRange = '30d', metric = 'executions', limit = 10): Promise<any[]> {
    const response = await apiClient.get<any[]>(`${this.basePath}/prompts/leaderboard`, {
      time_range: timeRange,
      metric,
      limit,
    });
    return response.data;
  }

  async getUserActivity(timeRange = '30d'): Promise<any[]> {
    const response = await apiClient.get<any[]>(`${this.basePath}/users/activity`, { time_range: timeRange });
    return response.data;
  }

  async getSystemHealth(): Promise<any> {
    const response = await apiClient.get<any>(`${this.basePath}/system/health`);
    return response.data;
  }

  async getCustomMetrics(query: string, timeRange = '30d'): Promise<any> {
    const response = await apiClient.post<any>(`${this.basePath}/custom`, {
      query,
      time_range: timeRange,
    });
    return response.data;
  }

  async exportData(filters: AnalyticsFilter, format: 'csv' | 'json' | 'xlsx' = 'csv'): Promise<Blob> {
    const params = {
      format,
      ...filters,
      prompt_ids: filters.prompt_ids?.join(','),
      providers: filters.providers?.join(','),
      tags: filters.tags?.join(','),
      start_date: filters.date_range?.start,
      end_date: filters.date_range?.end,
    };

    return await apiClient.download(`${this.basePath}/export`, `analytics-export.${format}`);
  }

  async getRealtimeMetrics(): Promise<any> {
    const response = await apiClient.get<any>(`${this.basePath}/realtime`);
    return response.data;
  }

  async createAlert(alertConfig: any): Promise<any> {
    const response = await apiClient.post<any>(`${this.basePath}/alerts`, alertConfig);
    return response.data;
  }

  async getAlerts(): Promise<any[]> {
    const response = await apiClient.get<any[]>(`${this.basePath}/alerts`);
    return response.data;
  }

  async updateAlert(id: string, alertConfig: any): Promise<any> {
    const response = await apiClient.put<any>(`${this.basePath}/alerts/${id}`, alertConfig);
    return response.data;
  }

  async deleteAlert(id: string): Promise<void> {
    await apiClient.delete(`${this.basePath}/alerts/${id}`);
  }

  async getDashboardData(timeRange = '30d'): Promise<any> {
    const response = await apiClient.get<any>(`${this.basePath}/dashboard`, { time_range: timeRange });
    return response.data;
  }
}

export const analyticsService = new AnalyticsService();
export default analyticsService;
