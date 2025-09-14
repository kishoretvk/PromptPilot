import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { settingsService } from '../services/SettingsService';
import { queryKeys, cacheUtils } from './queryClient';
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
} from '../types/Settings';

// Hook for fetching all settings
export const useSettings = () => {
  return useQuery({
    queryKey: queryKeys.settings.all,
    queryFn: () => settingsService.getSettings(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Hook for fetching theme settings
export const useThemeSettings = () => {
  return useQuery({
    queryKey: [...queryKeys.settings.all, 'theme'],
    queryFn: () => settingsService.getThemeSettings(),
    staleTime: 15 * 60 * 1000, // 15 minutes
  });
};

// Hook for fetching notification settings
export const useNotificationSettings = () => {
  return useQuery({
    queryKey: [...queryKeys.settings.all, 'notifications'],
    queryFn: () => settingsService.getNotificationSettings(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Hook for fetching security settings
export const useSecuritySettings = () => {
  return useQuery({
    queryKey: [...queryKeys.settings.all, 'security'],
    queryFn: () => settingsService.getSecuritySettings(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Hook for fetching API keys
export const useAPIKeys = () => {
  return useQuery({
    queryKey: queryKeys.settings.apiKeys(),
    queryFn: () => settingsService.getAPIKeys(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook for fetching integrations
export const useIntegrations = () => {
  return useQuery({
    queryKey: [...queryKeys.settings.all, 'integrations'],
    queryFn: () => settingsService.getIntegrations(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook for fetching LLM providers
export const useLLMProviders = () => {
  return useQuery({
    queryKey: [...queryKeys.settings.providers(), 'llm'],
    queryFn: () => settingsService.getLLMProviders(),
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
};

// Hook for fetching storage backends
export const useStorageBackends = () => {
  return useQuery({
    queryKey: [...queryKeys.settings.providers(), 'storage'],
    queryFn: () => settingsService.getStorageBackends(),
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
};

// Helper functions for mutations
const updateThemeSettings = async (settings: ThemeSettings): Promise<ThemeSettings> => {
  return await settingsService.updateThemeSettings(settings);
};

const updateNotificationSettings = async (settings: NotificationSettings): Promise<NotificationSettings> => {
  return await settingsService.updateNotificationSettings(settings);
};

const updateSecuritySettings = async (settings: SecuritySettings): Promise<SecuritySettings> => {
  return await settingsService.updateSecuritySettings(settings);
};

// Hook for updating theme settings
export const useUpdateThemeSettings = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: updateThemeSettings,
    onSuccess: (data) => {
      // Update the specific theme query so subscribers get the new value immediately
      queryClient.setQueryData([...queryKeys.settings.all, 'theme'], data);
      // Also merge the theme into the top-level settings cache if present
      queryClient.setQueryData(queryKeys.settings.all, (old: any) => ({
        ...(old ?? {}),
        theme: data,
      }));
      // Invalidate the theme query to ensure any other consumers refetch if needed
      queryClient.invalidateQueries({ queryKey: [...queryKeys.settings.all, 'theme'] });
      // Keep existing invalidation helper for broader cache refresh
      cacheUtils.invalidateSettings();
      // Persist selected mode to localStorage so InnerApp picks it up immediately
      try {
        if (typeof window !== 'undefined' && data?.mode) {
          localStorage.setItem('pp_theme_mode', data.mode);
          // notify other parts of the app that theme mode changed so they can re-render immediately
          try {
            window.dispatchEvent(new CustomEvent('pp_theme_mode_changed', { detail: data.mode }));
          } catch (e) {
            // ignore dispatch errors in older browsers/environments
          }
        }
      } catch (e) {
        // ignore localStorage errors
      }
    },
  });
};

// Hook for updating notification settings
export const useUpdateNotificationSettings = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: updateNotificationSettings,
    onSuccess: (data) => {
      queryClient.setQueryData([...queryKeys.settings.all, 'notifications'], data);
      cacheUtils.invalidateSettings();
    },
  });
};

// Hook for updating security settings
export const useUpdateSecuritySettings = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: updateSecuritySettings,
    onSuccess: (data) => {
      queryClient.setQueryData([...queryKeys.settings.all, 'security'], data);
      cacheUtils.invalidateSettings();
    },
  });
};

// Hook for creating API key
export const useCreateAPIKey = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (apiKey: CreateAPIKeyRequest) => settingsService.createAPIKey(apiKey),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.settings.apiKeys() });
    },
  });
};

// Hook for updating API key
export const useUpdateAPIKey = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAPIKeyRequest }) =>
      settingsService.updateAPIKey(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.settings.apiKeys() });
    },
  });
};

// Hook for deleting API key
export const useDeleteAPIKey = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => settingsService.deleteAPIKey(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.settings.apiKeys() });
    },
  });
};

// Hook for testing API key
export const useTestAPIKey = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => settingsService.testAPIKey(id),
  });
};

// Hook for creating integration
export const useCreateIntegration = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (integration: CreateIntegrationRequest) => settingsService.createIntegration(integration),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...queryKeys.settings.all, 'integrations'] });
    },
  });
};

// Hook for updating integration
export const useUpdateIntegration = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateIntegrationRequest }) =>
      settingsService.updateIntegration(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...queryKeys.settings.all, 'integrations'] });
    },
  });
};

// Hook for deleting integration
export const useDeleteIntegration = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => settingsService.deleteIntegration(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...queryKeys.settings.all, 'integrations'] });
    },
  });
};

// Hook for testing integration
export const useTestIntegration = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => settingsService.testIntegration(id),
  });
};

// Hook for syncing integration
export const useSyncIntegration = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => settingsService.syncIntegration(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...queryKeys.settings.all, 'integrations'] });
    },
  });
};

// Hook for exporting settings
export const useExportSettings = () => {
  return useMutation({
    mutationFn: (format: 'json' | 'yaml') => settingsService.exportSettings(format),
  });
};

// Hook for importing settings
export const useImportSettings = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (file: File) => settingsService.importSettings(file),
    onSuccess: () => {
      cacheUtils.invalidateSettings();
    },
  });
};

// Hook for resetting settings
export const useResetSettings = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: () => settingsService.resetSettings(),
    onSuccess: () => {
      cacheUtils.invalidateSettings();
    },
  });
};

// Utility hook for settings operations
export const useSettingsOperations = () => {
  const updateTheme = useUpdateThemeSettings();
  const updateNotifications = useUpdateNotificationSettings();
  const updateSecurity = useUpdateSecuritySettings();
  const createAPIKey = useCreateAPIKey();
  const updateAPIKey = useUpdateAPIKey();
  const deleteAPIKey = useDeleteAPIKey();
  const testAPIKey = useTestAPIKey();
  const createIntegration = useCreateIntegration();
  const updateIntegration = useUpdateIntegration();
  const deleteIntegration = useDeleteIntegration();
  const testIntegration = useTestIntegration();
  const syncIntegration = useSyncIntegration();
  
  return {
    // Theme operations
    updateTheme: updateTheme.mutate,
    isUpdatingTheme: updateTheme.isPending,
    themeUpdateError: updateTheme.error,
    
    // Notification operations
    updateNotifications: updateNotifications.mutate,
    isUpdatingNotifications: updateNotifications.isPending,
    notificationsUpdateError: updateNotifications.error,
    
    // Security operations
    updateSecurity: updateSecurity.mutate,
    isUpdatingSecurity: updateSecurity.isPending,
    securityUpdateError: updateSecurity.error,
    
    // API Key operations
    createAPIKey: createAPIKey.mutate,
    updateAPIKey: updateAPIKey.mutate,
    deleteAPIKey: deleteAPIKey.mutate,
    testAPIKey: testAPIKey.mutate,
    isCreatingAPIKey: createAPIKey.isPending,
    isUpdatingAPIKey: updateAPIKey.isPending,
    isDeletingAPIKey: deleteAPIKey.isPending,
    isTestingAPIKey: testAPIKey.isPending,
    apiKeyError: createAPIKey.error || updateAPIKey.error || deleteAPIKey.error,
    
    // Integration operations
    createIntegration: createIntegration.mutate,
    updateIntegration: updateIntegration.mutate,
    deleteIntegration: deleteIntegration.mutate,
    testIntegration: testIntegration.mutate,
    syncIntegration: syncIntegration.mutate,
    isCreatingIntegration: createIntegration.isPending,
    isUpdatingIntegration: updateIntegration.isPending,
    isDeletingIntegration: deleteIntegration.isPending,
    isTestingIntegration: testIntegration.isPending,
    isSyncingIntegration: syncIntegration.isPending,
    integrationError: createIntegration.error || updateIntegration.error || deleteIntegration.error,
  };
};
