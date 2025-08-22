import { apiClient } from './api';
import {
  Pipeline,
  CreatePipelineRequest,
  UpdatePipelineRequest,
  PipelineResult,
  ValidationResult,
  PaginatedResponse,
} from '../types';

class PipelineService {
  private basePath = '/pipelines';

  async getPipelines(page = 1, limit = 10, search?: string, tags?: string[]): Promise<PaginatedResponse<Pipeline>> {
    const params: any = { page, limit };
    if (search) params.search = search;
    if (tags && tags.length > 0) params.tags = tags.join(',');

    const response = await apiClient.get<PaginatedResponse<Pipeline>>(this.basePath, params);
    return response.data;
  }

  async getPipeline(id: string): Promise<Pipeline> {
    const response = await apiClient.get<Pipeline>(`${this.basePath}/${id}`);
    return response.data;
  }

  async createPipeline(pipeline: CreatePipelineRequest): Promise<Pipeline> {
    const response = await apiClient.post<Pipeline>(this.basePath, pipeline);
    return response.data;
  }

  async updatePipeline(id: string, pipeline: UpdatePipelineRequest): Promise<Pipeline> {
    const response = await apiClient.put<Pipeline>(`${this.basePath}/${id}`, pipeline);
    return response.data;
  }

  async deletePipeline(id: string): Promise<void> {
    await apiClient.delete(`${this.basePath}/${id}`);
  }

  async duplicatePipeline(id: string, name?: string): Promise<Pipeline> {
    const response = await apiClient.post<Pipeline>(`${this.basePath}/${id}/duplicate`, { name });
    return response.data;
  }

  async executePipeline(id: string, input: any): Promise<PipelineResult> {
    const response = await apiClient.post<PipelineResult>(`${this.basePath}/${id}/execute`, { input });
    return response.data;
  }

  async getExecutionResult(executionId: string): Promise<PipelineResult> {
    const response = await apiClient.get<PipelineResult>(`${this.basePath}/executions/${executionId}`);
    return response.data;
  }

  async getExecutionHistory(id: string, page = 1, limit = 10): Promise<PaginatedResponse<PipelineResult>> {
    const response = await apiClient.get<PaginatedResponse<PipelineResult>>(
      `${this.basePath}/${id}/executions`,
      { page, limit }
    );
    return response.data;
  }

  async getPipelineExecutions(id: string, page = 1, limit = 10): Promise<PaginatedResponse<PipelineResult>> {
    return this.getExecutionHistory(id, page, limit);
  }

  async cancelExecution(executionId: string): Promise<void> {
    await apiClient.post(`${this.basePath}/executions/${executionId}/cancel`);
  }

  async validatePipeline(pipeline: Partial<Pipeline>): Promise<ValidationResult> {
    const response = await apiClient.post<ValidationResult>(`${this.basePath}/validate`, pipeline);
    return response.data;
  }

  async testPipeline(id: string, input: any): Promise<PipelineResult> {
    const response = await apiClient.post<PipelineResult>(`${this.basePath}/${id}/test`, { input });
    return response.data;
  }

  async exportPipeline(id: string, format: 'json' | 'yaml' = 'json'): Promise<Blob> {
    return await apiClient.download(`${this.basePath}/${id}/export?format=${format}`, `pipeline-${id}.${format}`);
  }

  async importPipelines(file: File): Promise<Pipeline[]> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.upload<Pipeline[]>(`${this.basePath}/import`, formData);
    return response.data;
  }

  async getPipelineTags(): Promise<string[]> {
    const response = await apiClient.get<string[]>(`${this.basePath}/tags`);
    return response.data;
  }

  async getPipelineMetrics(id: string, days = 30): Promise<any> {
    const response = await apiClient.get<any>(`${this.basePath}/${id}/metrics`, { days });
    return response.data;
  }

  async getAvailableStepTypes(): Promise<any[]> {
    const response = await apiClient.get<any[]>(`${this.basePath}/step-types`);
    return response.data;
  }

  async generatePipelineFromTemplate(templateId: string, data: any): Promise<Pipeline> {
    const response = await apiClient.post<Pipeline>(`${this.basePath}/from-template/${templateId}`, data);
    return response.data;
  }

  async savePipelineAsTemplate(id: string, templateData: any): Promise<any> {
    const response = await apiClient.post<any>(`${this.basePath}/${id}/save-as-template`, templateData);
    return response.data;
  }

  async schedulePipeline(id: string, schedule: any): Promise<any> {
    const response = await apiClient.post<any>(`${this.basePath}/${id}/schedule`, schedule);
    return response.data;
  }

  async getScheduledExecutions(id: string): Promise<any[]> {
    const response = await apiClient.get<any[]>(`${this.basePath}/${id}/schedule`);
    return response.data;
  }
}

export const pipelineService = new PipelineService();
export default pipelineService;