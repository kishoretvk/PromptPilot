export interface APIKey {
  id: string;
  name: string;
  provider: string;
  key: string;
  is_active: boolean;
  created_at: string;
  last_used?: string;
  usage_limit?: number;
  current_usage?: number;
}

export interface Integration {
  id: string;
  name: string;
  type: 'llm_provider' | 'storage' | 'analytics' | 'notification';
  provider: string;
  configuration: Record<string, any>;
  is_active: boolean;
  status: 'connected' | 'disconnected' | 'error';
  last_sync?: string;
}

export interface ThemeSettings {
  mode: 'light' | 'dark' | 'auto';
  primary_color: string;
  secondary_color: string;
  font_family: string;
  font_size: 'small' | 'medium' | 'large';
  compact_mode: boolean;
}

export interface NotificationSettings {
  email_notifications: boolean;
  slack_notifications: boolean;
  webhook_url?: string;
  notification_types: {
    pipeline_completion: boolean;
    error_alerts: boolean;
    usage_warnings: boolean;
    system_updates: boolean;
  };
}

export interface SecuritySettings {
  require_api_key: boolean;
  api_key_expiry_days: number;
  max_requests_per_minute: number;
  allowed_domains: string[];
  cors_enabled: boolean;
}

export interface Settings {
  theme: ThemeSettings;
  notifications: NotificationSettings;
  security: SecuritySettings;
  api_keys: APIKey[];
  integrations: Integration[];
}

export interface CreateAPIKeyRequest {
  name: string;
  provider: string;
  key: string;
  usage_limit?: number;
}

export interface UpdateAPIKeyRequest {
  name?: string;
  is_active?: boolean;
  usage_limit?: number;
}

export interface CreateIntegrationRequest {
  name: string;
  type: 'llm_provider' | 'storage' | 'analytics' | 'notification';
  provider: string;
  configuration: Record<string, any>;
}

export interface UpdateIntegrationRequest {
  name?: string;
  configuration?: Record<string, any>;
  is_active?: boolean;
}

export interface LLMProvider {
  id: string;
  name: string;
  display_name: string;
  supported_models: string[];
  default_parameters: Record<string, any>;
  requires_api_key: boolean;
  documentation_url?: string;
}

export interface StorageBackend {
  id: string;
  name: string;
  type: 'file' | 'git' | 'database' | 'cloud';
  configuration_schema: Record<string, any>;
  is_default: boolean;
}