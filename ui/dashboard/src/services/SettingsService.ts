import { apiClient } from './api';
import {
  Settings,
  APIKey,
  Integration,
  ThemeSettings,
  NotificationSettings,
  SecuritySettings,
  CreateAPIKeyRequest,
  UpdateAPIKeyRequest,
  CreateIntegrationRequest,
  UpdateIntegrationRequest,
  LLMProvider,
  StorageBackend,
} from '../types/Settings';

class SettingsService {
  private basePath = '/api/v1/settings';

  // General Settings
  async getSettings(): Promise<Settings> {
    const response = await apiClient.get<Settings>(this.basePath);
    return response.data;
  }

  async updateSettings(settings: Partial<Settings>): Promise<Settings> {
    const response = await apiClient.put<Settings>(this.basePath, settings);
    return response.data;
  }

  // Theme Settings
  async getThemeSettings(): Promise<ThemeSettings> {
    const response = await apiClient.get<ThemeSettings>(`${this.basePath}/theme`);
    return response.data;
  }

  async updateThemeSettings(theme: Partial<ThemeSettings>): Promise<ThemeSettings> {
    const response = await apiClient.put<ThemeSettings>(`${this.basePath}/theme`, theme);
    return response.data;
  }

  // Notification Settings
  async getNotificationSettings(): Promise<NotificationSettings> {
    const response = await apiClient.get<NotificationSettings>(`${this.basePath}/notifications`);
    return response.data;
  }

  async updateNotificationSettings(notifications: Partial<NotificationSettings>): Promise<NotificationSettings> {
    const response = await apiClient.put<NotificationSettings>(`${this.basePath}/notifications`, notifications);
    return response.data;
  }

  // Security Settings
  async getSecuritySettings(): Promise<SecuritySettings> {
    const response = await apiClient.get<SecuritySettings>(`${this.basePath}/security`);
    return response.data;
  }

  async updateSecuritySettings(security: Partial<SecuritySettings>): Promise<SecuritySettings> {
    const response = await apiClient.put<SecuritySettings>(`${this.basePath}/security`, security);
    return response.data;
  }

  // API Keys Management
  async getAPIKeys(): Promise<APIKey[]> {
    const response = await apiClient.get<APIKey[]>(`${this.basePath}/api-keys`);
    return response.data;
  }

  async getAPIKey(id: string): Promise<APIKey> {
    const response = await apiClient.get<APIKey>(`${this.basePath}/api-keys/${id}`);
    return response.data;
  }

  async createAPIKey(apiKey: CreateAPIKeyRequest): Promise<APIKey> {
    const response = await apiClient.post<APIKey>(`${this.basePath}/api-keys`, apiKey);
    return response.data;
  }

  async updateAPIKey(id: string, apiKey: UpdateAPIKeyRequest): Promise<APIKey> {
    const response = await apiClient.put<APIKey>(`${this.basePath}/api-keys/${id}`, apiKey);
    return response.data;
  }

  async deleteAPIKey(id: string): Promise<void> {
    await apiClient.delete(`${this.basePath}/api-keys/${id}`);
  }

  async testAPIKey(id: string): Promise<{ status: 'valid' | 'invalid' | 'expired'; message: string }> {
    const response = await apiClient.post<{ status: 'valid' | 'invalid' | 'expired'; message: string }>(`${this.basePath}/api-keys/${id}/test`);
    return response.data;
  }

  // Integrations Management
  async getIntegrations(): Promise<Integration[]> {
    const response = await apiClient.get<Integration[]>(`${this.basePath}/integrations`);
    return response.data;
  }

  async getIntegration(id: string): Promise<Integration> {
    const response = await apiClient.get<Integration>(`${this.basePath}/integrations/${id}`);
    return response.data;
  }

  async createIntegration(integration: CreateIntegrationRequest): Promise<Integration> {
    const response = await apiClient.post<Integration>(`${this.basePath}/integrations`, integration);
    return response.data;
  }

  async updateIntegration(id: string, integration: UpdateIntegrationRequest): Promise<Integration> {
    const response = await apiClient.put<Integration>(`${this.basePath}/integrations/${id}`, integration);
    return response.data;
  }

  async deleteIntegration(id: string): Promise<void> {
    await apiClient.delete(`${this.basePath}/integrations/${id}`);
  }

  async testIntegration(id: string): Promise<{ status: 'connected' | 'disconnected' | 'error'; message: string }> {
    const response = await apiClient.post<{ status: 'connected' | 'disconnected' | 'error'; message: string }>(`${this.basePath}/integrations/${id}/test`);
    return response.data;
  }

  async syncIntegration(id: string): Promise<{ status: 'success' | 'error'; message: string }> {
    const response = await apiClient.post<{ status: 'success' | 'error'; message: string }>(`${this.basePath}/integrations/${id}/sync`);
    return response.data;
  }

  // Provider Information
  async getLLMProviders(): Promise<LLMProvider[]> {
    const response = await apiClient.get<LLMProvider[]>(`${this.basePath}/providers/llm`);
    return response.data;
  }

  async getStorageBackends(): Promise<StorageBackend[]> {
    const response = await apiClient.get<StorageBackend[]>(`${this.basePath}/providers/storage`);
    return response.data;
  }

  // System Configuration
  async exportSettings(format: 'json' | 'yaml' = 'json'): Promise<Blob> {
    return await apiClient.download(`${this.basePath}/export?format=${format}`, `settings.${format}`);
  }

  async importSettings(file: File): Promise<Settings> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.upload<Settings>(`${this.basePath}/import`, formData);
    return response.data;
  }

  async resetSettings(): Promise<Settings> {
    const response = await apiClient.post<Settings>(`${this.basePath}/reset`);
    return response.data;
  }

  async validateConfiguration(config: any): Promise<{ isValid: boolean; errors: string[] }> {
    const response = await apiClient.post<{ isValid: boolean; errors: string[] }>(`${this.basePath}/validate`, config);
    return response.data;
  }
}

export const settingsService = new SettingsService();
export default settingsService;
