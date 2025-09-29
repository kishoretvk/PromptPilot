import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  Typography,
  TextField,
  Button,
  Grid,
  Chip,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  Divider,
  Alert,
  Paper,
  Tab,
  Tabs,
  Slider,
} from '@mui/material';
import {
  ExpandMore,
  Add,
  Delete,
  Save,
  Preview,
  PlayArrow,
  Settings,
  Code,
  DataObject,
  Psychology,
  AutoFixHigh as AIFixIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { Prompt, Message, TestCase } from '../../types';
import { useCreatePrompt, useUpdatePrompt } from '../../hooks/usePrompts';
import { settingsService } from '../../services/SettingsService';
import AIRefinementPanel from '../AIRefinement/AIRefinementPanel';
import { ABTestPanel } from '../AIRefinement/ABTestPanel';
import { ExampleGenerationPanel } from '../AIRefinement/ExampleGenerationPanel';
import { ProviderSelector } from '../AIRefinement/ProviderSelector';
import { UsageDashboard } from '../AIRefinement/UsageDashboard';
import { promptService } from '../../services/PromptService';

interface PromptEditorProps {
  prompt?: Prompt | null;
  isCreating?: boolean;
  onPromptCreated?: (prompt: Prompt) => void;
  onPromptUpdated?: (prompt: Prompt) => void;
  onCancel: () => void;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index, ...other }) => (
  <div
    role="tabpanel"
    hidden={value !== index}
    id={`prompt-editor-tabpanel-${index}`}
    aria-labelledby={`prompt-editor-tab-${index}`}
    {...other}
  >
    {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
  </div>
);

const PromptEditor: React.FC<PromptEditorProps> = ({
  prompt,
  isCreating = false,
  onPromptCreated,
  onPromptUpdated,
  onCancel,
}) => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [formData, setFormData] = useState<Partial<Prompt>>({
    name: '',
    description: '',
    task_type: 'text_generation',
    tags: [],
    developer_notes: '',
    messages: [],
    input_variables: {},
    model_provider: 'ollama',
    model_name: 'llama2',
    parameters: {
      temperature: 0.7,
      max_tokens: 2048,
      top_p: 1.0,
      frequency_penalty: 0.0,
      presence_penalty: 0.0,
    },
    test_cases: [],
  });
  const [previewPrompt, setPreviewPrompt] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [progress, setProgress] = useState<string>('');
  // const [isLoading, setIsLoading] = useState(false); // Removed duplicate state
  const [optimizationResults, setOptimizationResults] = useState<any>(null);

  // Read-only mode when editing certain prompts
  const isReadOnly = false; // Can be controlled by props or prompt status

  const createPromptMutation = useCreatePrompt();
  const updatePromptMutation = useUpdatePrompt();

  // Ollama models fetched from backend for provider selection
  const [ollamaModels, setOllamaModels] = useState<any[]>([]);
  const [ollamaFetchError, setOllamaFetchError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function fetchOllamaModels() {
      if (formData.model_provider !== 'ollama') return;
      try {
        setOllamaFetchError(null);
        const models = await settingsService.getOllamaModels();
        if (!mounted) return;
        // Normalize to objects with name/id
        const normalized = (models || []).map((m: any) =>
          typeof m === 'string' ? { name: m } : (m?.name || m?.id ? m : { name: String(m) })
        );
        setOllamaModels(normalized);
      } catch (err: any) {
        if (!mounted) return;
        setOllamaFetchError(err?.message || String(err));
        setOllamaModels([]);
      }
    }
    fetchOllamaModels();
    return () => { mounted = false; };
  }, [formData.model_provider]);

  useEffect(() => {
    if (prompt) {
      setFormData({
        ...prompt,
        parameters: {
          temperature: 0.7,
          max_tokens: 2048,
          top_p: 1.0,
          frequency_penalty: 0.0,
          presence_penalty: 0.0,
          ...prompt.parameters,
        },
      });
    }
  }, [prompt]);

  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.description?.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.messages?.length) {
      newErrors.messages = 'At least one message is required';
    }

    if (formData.messages?.some(msg => !msg.content.trim())) {
      newErrors.messages = 'All messages must have content';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const updateFormData = useCallback((field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const addMessage = useCallback(() => {
    const newMessage: Message = {
      role: 'user',
      content: '',
      priority: (formData.messages?.length || 0) + 1,
    };
    
    updateFormData('messages', [...(formData.messages || []), newMessage]);
  }, [formData.messages, updateFormData]);

  const updateMessage = useCallback((index: number, field: string, value: any) => {
    const updatedMessages = [...(formData.messages || [])];
    updatedMessages[index] = {
      ...updatedMessages[index],
      [field]: value,
    };
    updateFormData('messages', updatedMessages);
  }, [formData.messages, updateFormData]);

  const removeMessage = useCallback((index: number) => {
    const updatedMessages = formData.messages?.filter((_, i) => i !== index) || [];
    updateFormData('messages', updatedMessages);
  }, [formData.messages, updateFormData]);

  const addTestCase = useCallback(() => {
    const newTestCase: TestCase = {
      id: `test_${Date.now()}`,
      name: `Test Case ${(formData.test_cases?.length || 0) + 1}`,
      input_variables: {},
      expected_output: '',
      status: 'pending',
    };
    
    updateFormData('test_cases', [...(formData.test_cases || []), newTestCase]);
  }, [formData.test_cases, updateFormData]);

  const updateTestCase = useCallback((index: number, field: string, value: any) => {
    const updatedTestCases = [...(formData.test_cases || [])];
    updatedTestCases[index] = {
      ...updatedTestCases[index],
      [field]: value,
    };
    updateFormData('test_cases', updatedTestCases);
  }, [formData.test_cases, updateFormData]);

  const removeTestCase = useCallback((index: number) => {
    const updatedTestCases = formData.test_cases?.filter((_, i) => i !== index) || [];
    updateFormData('test_cases', updatedTestCases);
  }, [formData.test_cases, updateFormData]);

  const generatePreview = useCallback(() => {
    const messages = formData.messages || [];
    const preview = messages
      .sort((a, b) => (a.priority || 0) - (b.priority || 0))
      .map(msg => `${msg.role.toUpperCase()}: ${msg.content}`)
      .join('\n\n');
    
    setPreviewPrompt(preview);
  }, [formData.messages]);

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      const promptData: Prompt = {
        id: prompt?.id || `prompt_${Date.now()}`,
        name: formData.name!,
        description: formData.description!,
        task_type: formData.task_type!,
        tags: formData.tags!,
        developer_notes: formData.developer_notes,
        version_info: prompt?.version_info || {
          id: `version_${Date.now()}`,
          prompt_id: prompt?.id || `prompt_${Date.now()}`,
          version: '1.0.0',
          content_snapshot: {
            messages: formData.messages || [],
            input_variables: formData.input_variables || {},
            model_provider: formData.model_provider || '',
            model_name: formData.model_name || '',
            parameters: formData.parameters || {}
          },
          created_by: 'Current User',
          created_at: new Date().toISOString(),
          is_active: true,
          tags: [],
        },
        messages: formData.messages!,
        input_variables: formData.input_variables!,
        model_provider: formData.model_provider!,
        model_name: formData.model_name!,
        parameters: formData.parameters!,
        test_cases: formData.test_cases || [],
        evaluation_metrics: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      if (isCreating) {
        const createdPrompt = await createPromptMutation.mutateAsync(promptData);
        onPromptCreated?.(createdPrompt);
      } else {
        const updatedPrompt = await updatePromptMutation.mutateAsync({
          id: prompt!.id,
          data: promptData
        });
        onPromptUpdated?.(updatedPrompt);
      }
    } catch (error) {
      console.error('Error saving prompt:', error);
    }
  };

  // const isLoading = createPromptMutation.isPending || updatePromptMutation.isPending; // Use mutation status directly

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5">
          {isCreating ? 'Create New Prompt' : 'Edit Prompt'}
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<Preview />}
            onClick={generatePreview}
          >
            Preview
          </Button>
          
          <Button
            variant="outlined"
            color="primary"
            startIcon={<AutoFixHigh />}
            onClick={() => {}}
            disabled={!formData.description?.trim()}
          >
            Optimize Prompt
          </Button>

          <Button
            variant="contained"
            startIcon={<Save />}
            onClick={handleSave}
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : (isCreating ? 'Create' : 'Save')}
          </Button>
          
          <Button
            variant="outlined"
            onClick={onCancel}
          >
            Cancel
          </Button>
        </Box>
      </Box>

      {/* Error Display */}
      {Object.keys(errors).length > 0 && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Please fix the following errors: {Object.values(errors).join(', ')}
        </Alert>
      )}

      <Card sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Tabs */}
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab icon={<DataObject />} label="Basic Info" />
          <Tab icon={<Psychology />} label="Messages" />
          <Tab icon={<Settings />} label="Parameters" />
          <Tab icon={<PlayArrow />} label="Test Cases" />
          <Tab icon={<AIFixIcon />} label="AI Refinement" />
          <Tab icon={<Code />} label="Preview" />
        </Tabs>

        {/* Tab Panels */}
        <Box sx={{ flex: 1, overflow: 'auto' }}>
          {/* Basic Info Tab */}
          <TabPanel value={activeTab} index={0}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Name"
                  value={formData.name}
                  onChange={(e) => updateFormData('name', e.target.value)}
                  error={!!errors.name}
                  helperText={errors.name}
                  required
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Task Type</InputLabel>
                  <Select
                    value={formData.task_type}
                    onChange={(e) => updateFormData('task_type', e.target.value)}
                  >
                    <MenuItem value="text_generation">Text Generation</MenuItem>
                    <MenuItem value="summarization">Summarization</MenuItem>
                    <MenuItem value="question_answering">Question Answering</MenuItem>
                    <MenuItem value="classification">Classification</MenuItem>
                    <MenuItem value="translation">Translation</MenuItem>
                    <MenuItem value="code_generation">Code Generation</MenuItem>
                    <MenuItem value="analysis">Analysis</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  multiline
                  rows={3}
                  value={formData.description}
                  onChange={(e) => updateFormData('description', e.target.value)}
                  error={!!errors.description}
                  helperText={errors.description}
                  required
                />
              </Grid>

              <Grid item xs={12}>
                <Button
                  variant="outlined"
                  color="primary"
                  startIcon={<AIFixIcon />}
                  onClick={() => promptService.optimizePrompt(prompt?.id || '', formData.description || '').then(setOptimizationResults)}
                  disabled={!prompt?.id || !formData.description?.trim()}
                >
                  Optimize
                </Button>
                {optimizationResults && (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    Optimization Results: {JSON.stringify(optimizationResults, null, 2)}
                  </Alert>
                )}
              </Grid>
              
              <Grid item xs={12}>
                <Autocomplete
                  multiple
                  freeSolo
                  options={['ai', 'nlp', 'gpt', 'analysis', 'generation']}
                  value={formData.tags || []}
                  onChange={(_, value) => updateFormData('tags', value)}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                      <Chip
                        variant="outlined"
                        label={option}
                        {...getTagProps({ index })}
                        key={option}
                      />
                    ))
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Tags"
                      placeholder="Add tags..."
                    />
                  )}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Developer Notes"
                  multiline
                  rows={3}
                  value={formData.developer_notes}
                  onChange={(e) => updateFormData('developer_notes', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="Additional notes, instructions, or context..."
                />
              </Grid>
            </Grid>
          </TabPanel>

          {/* Messages Tab */}
          <TabPanel value={activeTab} index={1}>
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">Messages</Typography>
              <Button
                variant="outlined"
                startIcon={<Add />}
                onClick={addMessage}
              >
                Add Message
              </Button>
            </Box>

            {formData.messages?.map((message, index) => (
              <Accordion key={index} defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography>
                    {message.role.toUpperCase()} - Priority {message.priority || 1}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth>
                        <InputLabel>Role</InputLabel>
                        <Select
                          value={message.role}
                          onChange={(e) => updateMessage(index, 'role', e.target.value)}
                        >
                          <MenuItem value="system">System</MenuItem>
                          <MenuItem value="developer">Developer</MenuItem>
                          <MenuItem value="user">User</MenuItem>
                          <MenuItem value="assistant">Assistant</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        label="Priority"
                        type="number"
                        value={message.priority || 1}
                        onChange={(e) => updateMessage(index, 'priority', parseInt(e.target.value))}
                        disabled={isReadOnly}
                      />
                    </Grid>
                    
                    <Grid item xs={12} md={2}>
                      <IconButton
                        color="error"
                        onClick={() => removeMessage(index)}
                      >
                        <Delete />
                      </IconButton>
                    </Grid>
                    
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Content"
                        multiline
                        rows={4}
                        value={message.content}
                        onChange={(e) => updateMessage(index, 'content', e.target.value)}
                        disabled={isReadOnly}
                        placeholder="Enter message content... Use {variable_name} for variables"
                      />
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>
            )) || (
              <Typography color="text.secondary" textAlign="center" sx={{ py: 4 }}>
                No messages added yet. Click "Add Message" to get started.
              </Typography>
            )}
          </TabPanel>

          {/* Parameters Tab */}
          <TabPanel value={activeTab} index={2}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Model Provider</InputLabel>
                  <Select
                    value={formData.model_provider}
                    onChange={(e) => updateFormData('model_provider', e.target.value)}
                  >
                    <MenuItem value="openai">OpenAI</MenuItem>
                    <MenuItem value="anthropic">Anthropic</MenuItem>
                    <MenuItem value="google">Google</MenuItem>
                    <MenuItem value="azure">Azure OpenAI</MenuItem>
                    <MenuItem value="ollama">Ollama</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                {formData.model_provider === 'ollama' ? (
                  <Autocomplete
                    freeSolo
                    options={ollamaModels}
                    getOptionLabel={(opt: any) => (typeof opt === 'string' ? opt : opt.name || opt.id || '')}
                    value={
                      // try to find matching object or fallback to string
                      (ollamaModels.find(m => (m.name || m.id) === formData.model_name) as any) || formData.model_name || null
                    }
                    onChange={(_, value) => {
                      const modelName = typeof value === 'string' ? value : (value?.name || value?.id || '');
                      updateFormData('model_name', modelName);
                    }}
                    onInputChange={(_, value) => updateFormData('model_name', value)}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        fullWidth
                        label="Model Name (Ollama)"
                        placeholder={ollamaModels.length ? 'Select a model' : 'Type a model name'}
                        helperText={ollamaFetchError ? `Failed to fetch models: ${ollamaFetchError}` : undefined}
                        disabled={isReadOnly}
                      />
                    )}
                    renderOption={(props, option) => (
                      <li {...props} key={(option as any).id || (option as any).name || option}>
                        {(option as any).name || (option as any).id || option}
                      </li>
                    )}
                    disabled={isReadOnly}
                    sx={{ width: '100%' }}
                  />
                ) : (
                  <TextField
                    fullWidth
                    label="Model Name"
                    value={formData.model_name}
                    onChange={(e) => updateFormData('model_name', e.target.value)}
                    disabled={isReadOnly}
                  />
                )}
              </Grid>
              
              <Grid item xs={12}>
                <Typography gutterBottom>Temperature: {formData.parameters?.temperature}</Typography>
                <Slider
                  value={formData.parameters?.temperature || 0.7}
                  onChange={(_, value) => updateFormData('parameters', {
                    ...formData.parameters,
                    temperature: value,
                  })}
                  min={0}
                  max={2}
                  step={0.1}
                  marks={[
                    { value: 0, label: '0' },
                    { value: 1, label: '1' },
                    { value: 2, label: '2' },
                  ]}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Max Tokens"
                  type="number"
                  value={formData.parameters?.max_tokens || 2048}
                  onChange={(e) => updateFormData('parameters', {
                    ...formData.parameters,
                    max_tokens: parseInt(e.target.value),
                  })}
                  disabled={isReadOnly}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Top P"
                  type="number"
                  value={formData.parameters?.top_p || 1.0}
                  onChange={(e) => updateFormData('parameters', {
                    ...formData.parameters,
                    top_p: parseFloat(e.target.value),
                  })}
                  disabled={isReadOnly}
                  inputProps={{ min: 0, max: 1, step: 0.1 }}
                />
              </Grid>
            </Grid>
          </TabPanel>

          {/* Test Cases Tab */}
          <TabPanel value={activeTab} index={3}>
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">Test Cases</Typography>
              {!isReadOnly && (
                <Button
                  variant="outlined"
                  startIcon={<Add />}
                  onClick={addTestCase}
                >
                  Add Test Case
                </Button>
              )}
            </Box>

            {formData.test_cases?.map((testCase, index) => (
              <Accordion key={index}>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography>{testCase.name}</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={8}>
                      <TextField
                        fullWidth
                        label="Test Case Name"
                        value={testCase.name}
                        onChange={(e) => updateTestCase(index, 'name', e.target.value)}
                        disabled={isReadOnly}
                      />
                    </Grid>
                    
                    <Grid item xs={12} md={4}>
                      {!isReadOnly && (
                        <IconButton
                          color="error"
                          onClick={() => removeTestCase(index)}
                        >
                          <Delete />
                        </IconButton>
                      )}
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Input Variables (JSON)"
                        multiline
                        rows={3}
                        value={JSON.stringify(testCase.inputs, null, 2)}
                        onChange={(e) => {
                          try {
                            const inputs = JSON.parse(e.target.value);
                            updateTestCase(index, 'inputs', inputs);
                          } catch {
                            // Invalid JSON, ignore
                          }
                        }}
                        disabled={isReadOnly}
                      />
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Expected Output"
                        multiline
                        rows={3}
                        value={testCase.expected_outputs}
                        onChange={(e) => updateTestCase(index, 'expected_outputs', e.target.value)}
                        disabled={isReadOnly}
                      />
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>
            )) || (
              <Typography color="text.secondary" textAlign="center" sx={{ py: 4 }}>
                No test cases added yet. Click "Add Test Case" to get started.
              </Typography>
            )}
          </TabPanel>

          {/* Preview Tab */}
          <TabPanel value={activeTab} index={5}>
            <Paper sx={{ p: 3, backgroundColor: theme.palette.grey[50] }}>
              <Typography variant="h6" gutterBottom>
                Prompt Preview
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              {previewPrompt ? (
                <Typography
                  component="pre"
                  sx={{
                    fontFamily: 'monospace',
                    whiteSpace: 'pre-wrap',
                    fontSize: '0.875rem',
                    lineHeight: 1.5,
                  }}
                >
                  {previewPrompt}
                </Typography>
              ) : (
                <Typography color="text.secondary" textAlign="center" sx={{ py: 4 }}>
                  Click "Preview" to generate prompt preview
                </Typography>
              )}
            </Paper>
          </TabPanel>

          {/* AI Refinement Tab */}
          <TabPanel value={activeTab} index={4}>
            <Box sx={{ height: '100%', overflow: 'auto' }}>
              <AIRefinementPanel
                promptData={{
                  id: formData.id || `temp_${Date.now()}`,
                  name: formData.name || '',
                  description: formData.description || '',
                  content: previewPrompt,
                  messages: formData.messages || [],
                  input_variables: formData.input_variables || {},
                  model_provider: formData.model_provider || 'openai',
                  model_name: formData.model_name || 'gpt-4',
                  parameters: formData.parameters || {},
                  tags: formData.tags || [],
                  task_type: formData.task_type || 'text_generation',
                }}
                onRefinementComplete={(refinedPrompt) => {
                  // Update the form with refined data
                  if (refinedPrompt.messages) {
                    updateFormData('messages', refinedPrompt.messages);
                  }
                  if (refinedPrompt.input_variables) {
                    updateFormData('input_variables', refinedPrompt.input_variables);
                  }
                  if (refinedPrompt.parameters) {
                    updateFormData('parameters', { ...formData.parameters, ...refinedPrompt.parameters });
                  }
                  // Switch to preview tab to show changes
                  setActiveTab(5);
                }}
                  onQualityUpdate={(qualityScore: any) => {
                  // Could store quality score in form data or display it
                  console.log('Quality updated:', qualityScore);
                }}
              />
            </Box>
          </TabPanel>
        </Box>
      </Card>
    </Box>
  );
};

export default PromptEditor;
