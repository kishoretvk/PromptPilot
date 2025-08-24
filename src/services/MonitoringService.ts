import { apiClient } from './api';
import {
  SystemHealth,
  Alert,
  MonitoringData,
  AlertRule,
} from '../types/Monitoring';

class MonitoringService {
  private basePath = '/monitoring';

  async getSystemHealth(): Promise<SystemHealth> {
    try {
      const response = await apiClient.get<SystemHealth>(`${this.basePath}/health`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch system health: ${error}`);
    }
  }

  async getMonitoringData(timeRange: string = '24h'): Promise<MonitoringData> {
    try {
      const response = await apiClient.get<MonitoringData>(`${this.basePath}/metrics`, {
        time_range: timeRange
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch monitoring data: ${error}`);
    }
  }

  async getAlerts(activeOnly: boolean = true): Promise<Alert[]> {
    try {
      const response = await apiClient.get<Alert[]>(`${this.basePath}/alerts`, {
        active: activeOnly
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch alerts: ${error}`);
    }
  }

  async getAlertRules(): Promise<AlertRule[]> {
    try {
      const response = await apiClient.get<AlertRule[]>(`${this.basePath}/alert-rules`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch alert rules: ${error}`);
    }
  }

  async createAlertRule(rule: Partial<AlertRule>): Promise<AlertRule> {
    try {
      const response = await apiClient.post<AlertRule>(`${this.basePath}/alert-rules`, rule);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to create alert rule: ${error}`);
    }
  }

  async updateAlertRule(id: string, rule: Partial<AlertRule>): Promise<AlertRule> {
    try {
      const response = await apiClient.put<AlertRule>(`${this.basePath}/alert-rules/${id}`, rule);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to update alert rule: ${error}`);
    }
  }

  async deleteAlertRule(id: string): Promise<void> {
    try {
      await apiClient.delete(`${this.basePath}/alert-rules/${id}`);
    } catch (error) {
      throw new Error(`Failed to delete alert rule: ${error}`);
    }
  }

  async acknowledgeAlert(id: string): Promise<Alert> {
    try {
      const response = await apiClient.post<Alert>(`${this.basePath}/alerts/${id}/acknowledge`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to acknowledge alert: ${error}`);
    }
  }

  async resolveAlert(id: string): Promise<Alert> {
    try {
      const response = await apiClient.post<Alert>(`${this.basePath}/alerts/${id}/resolve`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to resolve alert: ${error}`);
    }
  }

  async getAlertHistory(hours: number = 24): Promise<Alert[]> {
    try {
      const response = await apiClient.get<Alert[]>(`${this.basePath}/alerts/history`, {
        hours
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch alert history: ${error}`);
    }
  }

  async exportMetrics(format: 'csv' | 'json' = 'csv'): Promise<Blob> {
    try {
      return await apiClient.download(`${this.basePath}/export?format=${format}`, `monitoring-export.${format}`);
    } catch (error) {
      throw new Error(`Failed to export metrics: ${error}`);
    }
  }

  async getRealtimeMetrics(): Promise<any> {
    try {
      const response = await apiClient.get<any>(`${this.basePath}/realtime`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch real-time metrics: ${error}`);
    }
  }
}

export const monitoringService = new MonitoringService();
export default monitoringService;