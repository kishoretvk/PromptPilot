import * as yup from 'yup';

// Prompt Form Validation Schema
export const promptValidationSchema = yup.object({
  name: yup
    .string()
    .required('Prompt name is required')
    .min(3, 'Name must be at least 3 characters')
    .max(100, 'Name must be less than 100 characters')
    .matches(/^[a-zA-Z0-9\s\-_]+$/, 'Name can only contain alphanumeric characters, spaces, hyphens, and underscores'),
  
  description: yup
    .string()
    .required('Description is required')
    .min(10, 'Description must be at least 10 characters')
    .max(500, 'Description must be less than 500 characters'),
  
  content: yup
    .string()
    .required('Prompt content is required')
    .min(10, 'Content must be at least 10 characters')
    .max(10000, 'Content must be less than 10,000 characters')
    .test('has-variables', 'Prompt should contain at least one variable (e.g., {{variable}})', 
      value => value ? /\{\{[\w\s]+\}\}/.test(value) : false),
  
  tags: yup
    .array()
    .of(yup.string().min(2, 'Each tag must be at least 2 characters'))
    .min(1, 'At least one tag is required')
    .max(10, 'Maximum 10 tags allowed'),
  
  task_type: yup
    .string()
    .required('Task type is required')
    .oneOf(['completion', 'chat', 'classification', 'extraction', 'summarization'], 'Invalid task type'),
  
  temperature: yup
    .number()
    .min(0, 'Temperature must be between 0 and 2')
    .max(2, 'Temperature must be between 0 and 2')
    .optional(),
  
  max_tokens: yup
    .number()
    .min(1, 'Max tokens must be at least 1')
    .max(4000, 'Max tokens cannot exceed 4000')
    .optional(),
});

// Pipeline Form Validation Schema
export const pipelineValidationSchema = yup.object({
  name: yup
    .string()
    .required('Pipeline name is required')
    .min(3, 'Name must be at least 3 characters')
    .max(100, 'Name must be less than 100 characters'),
  
  description: yup
    .string()
    .required('Description is required')
    .min(10, 'Description must be at least 10 characters')
    .max(500, 'Description must be less than 500 characters'),
  
  nodes: yup
    .array()
    .of(yup.object({
      id: yup.string().required(),
      type: yup.string().required(),
      position: yup.object({
        x: yup.number().required(),
        y: yup.number().required(),
      }).required(),
      data: yup.object({
        label: yup.string().required('Node label is required'),
        prompt_id: yup.string().when('type', {
          is: 'prompt',
          then: (schema) => schema.required('Prompt ID is required for prompt nodes'),
          otherwise: (schema) => schema.optional(),
        }),
        configuration: yup.object().optional(),
      }).required(),
    }))
    .min(1, 'Pipeline must have at least one node')
    .max(50, 'Pipeline cannot have more than 50 nodes'),
  
  edges: yup
    .array()
    .of(yup.object({
      id: yup.string().required(),
      source: yup.string().required(),
      target: yup.string().required(),
      type: yup.string().optional(),
    }))
    .optional(),
  
  tags: yup
    .array()
    .of(yup.string().min(2, 'Each tag must be at least 2 characters'))
    .max(10, 'Maximum 10 tags allowed')
    .optional(),
});

// Settings Form Validation Schemas
export const apiKeyValidationSchema = yup.object({
  name: yup
    .string()
    .required('API key name is required')
    .min(3, 'Name must be at least 3 characters')
    .max(50, 'Name must be less than 50 characters'),
  
  provider: yup
    .string()
    .required('Provider is required')
    .oneOf(['openai', 'anthropic', 'google', 'azure', 'cohere'], 'Invalid provider'),
  
  key: yup
    .string()
    .required('API key is required')
    .min(10, 'API key must be at least 10 characters')
    .matches(/^[a-zA-Z0-9\-_]+$/, 'Invalid API key format'),
  
  usage_limit: yup
    .number()
    .min(0, 'Usage limit cannot be negative')
    .max(1000000, 'Usage limit too high')
    .optional(),
});

export const integrationValidationSchema = yup.object({
  name: yup
    .string()
    .required('Integration name is required')
    .min(3, 'Name must be at least 3 characters')
    .max(50, 'Name must be less than 50 characters'),
  
  type: yup
    .string()
    .required('Integration type is required')
    .oneOf(['llm_provider', 'storage', 'analytics', 'notification'], 'Invalid integration type'),
  
  provider: yup
    .string()
    .required('Provider is required'),
  
  configuration: yup
    .object()
    .required('Configuration is required')
    .test('valid-json', 'Configuration must be valid JSON', function(value) {
      if (!value) return false;
      try {
        JSON.stringify(value);
        return true;
      } catch {
        return false;
      }
    }),
});

export const securitySettingsValidationSchema = yup.object({
  session_timeout: yup
    .number()
    .min(5, 'Session timeout must be at least 5 minutes')
    .max(1440, 'Session timeout cannot exceed 24 hours')
    .required('Session timeout is required'),
  
  max_login_attempts: yup
    .number()
    .min(1, 'Must allow at least 1 login attempt')
    .max(10, 'Maximum 10 login attempts allowed')
    .required('Max login attempts is required'),
  
  password_min_length: yup
    .number()
    .min(8, 'Password minimum length must be at least 8')
    .max(128, 'Password minimum length cannot exceed 128')
    .required('Password minimum length is required'),
  
  require_2fa: yup
    .boolean()
    .required('2FA requirement must be specified'),
  
  allowed_domains: yup
    .array()
    .of(yup.string().matches(
      /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/,
      'Invalid domain format'
    ))
    .min(1, 'At least one domain must be specified')
    .max(50, 'Maximum 50 domains allowed'),
  
  ip_whitelist: yup
    .array()
    .of(yup.string().matches(
      /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)(?:\/(?:[0-9]|[1-2][0-9]|3[0-2]))?$/,
      'Invalid IP address or CIDR format'
    ))
    .max(100, 'Maximum 100 IP addresses allowed')
    .optional(),
});

export const themeSettingsValidationSchema = yup.object({
  mode: yup
    .string()
    .required('Theme mode is required')
    .oneOf(['light', 'dark', 'auto'], 'Invalid theme mode'),
  
  primary_color: yup
    .string()
    .required('Primary color is required')
    .matches(/^#[0-9A-F]{6}$/i, 'Invalid hex color format'),
  
  secondary_color: yup
    .string()
    .required('Secondary color is required')
    .matches(/^#[0-9A-F]{6}$/i, 'Invalid hex color format'),
  
  font_size: yup
    .string()
    .required('Font size is required')
    .oneOf(['small', 'medium', 'large'], 'Invalid font size'),
  
  compact_mode: yup
    .boolean()
    .required('Compact mode setting is required'),
});

export const notificationSettingsValidationSchema = yup.object({
  email_notifications: yup
    .boolean()
    .required('Email notification setting is required'),
  
  slack_notifications: yup
    .boolean()
    .required('Slack notification setting is required'),
  
  webhook_url: yup
    .string()
    .when('slack_notifications', {
      is: true,
      then: (schema) => schema
        .required('Webhook URL is required when Slack notifications are enabled')
        .url('Invalid webhook URL format'),
      otherwise: (schema) => schema.optional(),
    }),
  
  notification_types: yup.object({
    pipeline_completion: yup.boolean().required(),
    error_alerts: yup.boolean().required(),
    usage_warnings: yup.boolean().required(),
    system_updates: yup.boolean().required(),
  }).required('Notification types are required'),
});

// Test Form Validation Schema
export const testPromptValidationSchema = yup.object({
  inputs: yup
    .object()
    .test('required-inputs', 'All required inputs must be provided', function(value: any) {
      if (!value) return false;
      
      // Extract required variables from prompt content
      const promptContent = this.parent.promptContent || '';
      const variables = promptContent.match(/\{\{(\w+)\}\}/g) || [];
      const requiredVars = variables.map((v: string) => v.slice(2, -2));
      
      return requiredVars.every((varName: string) => 
        value[varName] && value[varName].toString().trim().length > 0
      );
    }),
  
  options: yup.object({
    temperature: yup
      .number()
      .min(0, 'Temperature must be between 0 and 2')
      .max(2, 'Temperature must be between 0 and 2')
      .optional(),
    
    max_tokens: yup
      .number()
      .min(1, 'Max tokens must be at least 1')
      .max(4000, 'Max tokens cannot exceed 4000')
      .optional(),
    
    top_p: yup
      .number()
      .min(0, 'Top P must be between 0 and 1')
      .max(1, 'Top P must be between 0 and 1')
      .optional(),
    
    frequency_penalty: yup
      .number()
      .min(-2, 'Frequency penalty must be between -2 and 2')
      .max(2, 'Frequency penalty must be between -2 and 2')
      .optional(),
    
    presence_penalty: yup
      .number()
      .min(-2, 'Presence penalty must be between -2 and 2')
      .max(2, 'Presence penalty must be between -2 and 2')
      .optional(),
  }).optional(),
});

// User Profile Validation Schema
export const userProfileValidationSchema = yup.object({
  name: yup
    .string()
    .required('Name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be less than 50 characters')
    .matches(/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces'),
  
  email: yup
    .string()
    .required('Email is required')
    .email('Invalid email format')
    .max(100, 'Email must be less than 100 characters'),
  
  role: yup
    .string()
    .required('Role is required')
    .oneOf(['admin', 'editor', 'viewer'], 'Invalid role'),
  
  bio: yup
    .string()
    .max(500, 'Bio must be less than 500 characters')
    .optional(),
  
  avatar_url: yup
    .string()
    .url('Invalid avatar URL format')
    .optional(),
});

// Password Change Validation Schema
export const passwordChangeValidationSchema = yup.object({
  current_password: yup
    .string()
    .required('Current password is required')
    .min(8, 'Password must be at least 8 characters'),
  
  new_password: yup
    .string()
    .required('New password is required')
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be less than 128 characters')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character'
    )
    .test('not-same', 'New password must be different from current password', 
      function(value) {
        return value !== this.parent.current_password;
      }),
  
  confirm_password: yup
    .string()
    .required('Password confirmation is required')
    .oneOf([yup.ref('new_password')], 'Passwords must match'),
});

// Search and Filter Validation Schema
export const searchFilterValidationSchema = yup.object({
  search: yup
    .string()
    .max(100, 'Search term must be less than 100 characters')
    .optional(),
  
  tags: yup
    .array()
    .of(yup.string().min(2, 'Each tag must be at least 2 characters'))
    .max(10, 'Maximum 10 tags allowed')
    .optional(),
  
  task_type: yup
    .string()
    .oneOf(['completion', 'chat', 'classification', 'extraction', 'summarization', ''], 
      'Invalid task type')
    .optional(),
  
  status: yup
    .string()
    .oneOf(['active', 'draft', 'archived', ''], 'Invalid status')
    .optional(),
  
  author: yup
    .string()
    .max(50, 'Author must be less than 50 characters')
    .optional(),
  
  date_from: yup
    .date()
    .max(new Date(), 'Date cannot be in the future')
    .optional(),
  
  date_to: yup
    .date()
    .min(yup.ref('date_from'), 'End date must be after start date')
    .max(new Date(), 'Date cannot be in the future')
    .optional(),
});

// Export validation error handler
export const getValidationErrors = (error: yup.ValidationError) => {
  const errors: Record<string, string> = {};
  
  if (error.inner) {
    error.inner.forEach((err) => {
      if (err.path) {
        errors[err.path] = err.message;
      }
    });
  }
  
  return errors;
};

// Custom validation helpers
export const validatePromptVariables = (content: string, inputs: Record<string, any>) => {
  const variables = content.match(/\{\{(\w+)\}\}/g) || [];
  const requiredVars = variables.map((v: string) => v.slice(2, -2));
  const missingVars = requiredVars.filter((varName: string) => 
    !inputs[varName] || inputs[varName].toString().trim().length === 0
  );
  
  return {
    isValid: missingVars.length === 0,
    missingVariables: missingVars,
    requiredVariables: requiredVars,
  };
};

export const validateJSONConfiguration = (jsonString: string) => {
  try {
    const parsed = JSON.parse(jsonString);
    return { isValid: true, parsed };
  } catch (error) {
    return { 
      isValid: false, 
      error: error instanceof Error ? error.message : 'Invalid JSON' 
    };
  }
};