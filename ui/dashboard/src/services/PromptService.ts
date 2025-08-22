import { apiClient } from './api';
import {
  Prompt,
  CreatePromptRequest,
  UpdatePromptRequest,
  TestData,
  TestResult,
  PromptVersion,
  PaginatedResponse,
} from '../types';

class PromptService {
  private basePath = '/prompts';

  async getPrompts(page = 1, limit = 10, search?: string, tags?: string[]): Promise<PaginatedResponse<Prompt>> {
    const params: any = { page, limit };
    if (search) params.search = search;
    if (tags && tags.length > 0) params.tags = tags.join(',');

    const response = await apiClient.get<PaginatedResponse<Prompt>>(this.basePath, params);
    return response.data;
  }

  async getPrompt(id: string): Promise<Prompt> {
    const response = await apiClient.get<Prompt>(`${this.basePath}/${id}`);
    return response.data;
  }

  async createPrompt(prompt: CreatePromptRequest): Promise<Prompt> {
    const response = await apiClient.post<Prompt>(this.basePath, prompt);
    return response.data;
  }

  async updatePrompt(id: string, prompt: UpdatePromptRequest): Promise<Prompt> {
    const response = await apiClient.put<Prompt>(`${this.basePath}/${id}`, prompt);
    return response.data;
  }

  async deletePrompt(id: string): Promise<void> {
    await apiClient.delete(`${this.basePath}/${id}`);
  }

  async duplicatePrompt(id: string, name?: string): Promise<Prompt> {
    const response = await apiClient.post<Prompt>(`${this.basePath}/${id}/duplicate`, { name });
    return response.data;
  }

  async testPrompt(id: string, testData: TestData): Promise<TestResult> {
    const response = await apiClient.post<TestResult>(`${this.basePath}/${id}/test`, testData);
    return response.data;
  }

  async getPromptVersions(id: string): Promise<PromptVersion[]> {
    const response = await apiClient.get<PromptVersion[]>(`${this.basePath}/${id}/versions`);
    return response.data;
  }

  async createPromptVersion(id: string, changelog?: string): Promise<PromptVersion> {
    const response = await apiClient.post<PromptVersion>(`${this.basePath}/${id}/versions`, { changelog });
    return response.data;
  }

  async restorePromptVersion(id: string, version: string): Promise<Prompt> {
    const response = await apiClient.post<Prompt>(`${this.basePath}/${id}/versions/${version}/restore`);
    return response.data;
  }

  async getPromptByVersion(id: string, version: string): Promise<Prompt> {
    const response = await apiClient.get<Prompt>(`${this.basePath}/${id}/versions/${version}`);
    return response.data;
  }

  async compareVersions(id: string, version1: string, version2: string): Promise<any> {
    const response = await apiClient.get<any>(`${this.basePath}/${id}/versions/compare`, {
      version1,
      version2,
    });
    return response.data;
  }

  async exportPrompt(id: string, format: 'json' | 'yaml' = 'json'): Promise<Blob> {
    return await apiClient.download(`${this.basePath}/${id}/export?format=${format}`, `prompt-${id}.${format}`);
  }

  async importPrompts(file: File): Promise<Prompt[]> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.upload<Prompt[]>(`${this.basePath}/import`, formData);
    return response.data;
  }

  async getPromptTags(): Promise<string[]> {
    const response = await apiClient.get<string[]>(`${this.basePath}/tags`);
    return response.data;
  }

  async getPromptMetrics(id: string, days = 30): Promise<any> {
    const response = await apiClient.get<any>(`${this.basePath}/${id}/metrics`, { days });
    return response.data;
  }

  async getTestHistory(id: string): Promise<any[]> {
    const response = await apiClient.get<any[]>(`${this.basePath}/${id}/test-history`);
    return response.data;
  }

  async validatePrompt(prompt: Partial<Prompt>): Promise<{ isValid: boolean; errors: string[] }> {
    const response = await apiClient.post<{ isValid: boolean; errors: string[] }>(`${this.basePath}/validate`, prompt);
    return response.data;
  }
}

export const promptService = new PromptService();
export default promptService;