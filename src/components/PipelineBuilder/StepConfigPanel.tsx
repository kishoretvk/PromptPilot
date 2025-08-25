import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  CardHeader,
  IconButton,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Chip,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Close as CloseIcon,
  ExpandMore,
  Save as SaveIcon,
  Settings as SettingsIcon,
  Psychology,
  Transform,
  FilterAlt,
  Api,
  Assessment,
} from '@mui/icons-material';
import { Node } from 'reactflow';

interface StepConfigPanelProps {
  node: Node;
  onNodeUpdate: (node: Node) => void;
  onClose: () => void;
}

interface StepConfig {
  [key: string]: any;
}

const StepConfigPanel: React.FC<StepConfigPanelProps> = ({
  node,
  onNodeUpdate,
  onClose,
}) => {
  const theme = useTheme();
  const [config, setConfig] = useState<StepConfig>(node.data.config || {});
  const [nodeName, setNodeName] = useState(node.data.label || '');

  useEffect(() => {
    setConfig(node.data.config || {});
    setNodeName(node.data.label || '');
  }, [node]);

  const handleConfigChange = (field: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = () => {
    const updatedNode: Node = {
      ...node,
      data: {
        ...node.data,
        label: nodeName,
        config,
      },
    };
    onNodeUpdate(updatedNode);
    onClose();
  };

  const getStepIcon = (type: string) => {
    switch (type) {
      case 'prompt':
        return <Psychology color="primary" />;
      case 'transform':
        return <Transform color="warning" />;
      case 'filter':
        return <FilterAlt color="success" />;
      case 'api':
        return <Api color="secondary" />;
      case 'analysis':
        return <Assessment color="error" />;
      default:
        return <SettingsIcon />;
    }
  };

  const renderPromptConfig = () => (
    <Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 2 }}>
        <Box sx={{ gridColumn: '1 / -1' }}>
          <FormControl fullWidth>
            <InputLabel>Prompt Template</InputLabel>
            <Select
              value={config.prompt_id || ''}
              onChange={(e) => handleConfigChange('prompt_id', e.target.value)}
            >
              <MenuItem value="prompt_1">Customer Service Response</MenuItem>
              <MenuItem value="prompt_2">Content Generation</MenuItem>
              <MenuItem value="prompt_3">Code Review</MenuItem>
              <MenuItem value="prompt_4">Data Analysis</MenuItem>
            </Select>
          </FormControl>
        </Box>
        
        <Box>
          <FormControl fullWidth>
            <InputLabel>Model Provider</InputLabel>
            <Select
              value={config.model_provider || 'openai'}
              onChange={(e) => handleConfigChange('model_provider', e.target.value)}
            >
              <MenuItem value="openai">OpenAI</MenuItem>
              <MenuItem value="anthropic">Anthropic</MenuItem>
              <MenuItem value="google">Google</MenuItem>
              <MenuItem value="azure">Azure OpenAI</MenuItem>
            </Select>
          </FormControl>
        </Box>
        
        <Box>
          <TextField
            fullWidth
            label="Model Name"
            value={config.model_name || 'gpt-3.5-turbo'}
            onChange={(e) => handleConfigChange('model_name', e.target.value)}
          />
        </Box>
        
        <Box>
          <TextField
            fullWidth
            label="Temperature"
            type="number"
            value={config.temperature || 0.7}
            onChange={(e) => handleConfigChange('temperature', parseFloat(e.target.value))}
            inputProps={{ min: 0, max: 2, step: 0.1 }}
          />
        </Box>
        
        <Box>
          <TextField
            fullWidth
            label="Max Tokens"
            type="number"
            value={config.max_tokens || 2048}
            onChange={(e) => handleConfigChange('max_tokens', parseInt(e.target.value))}
          />
        </Box>
        
        <Box sx={{ gridColumn: '1 / -1' }}>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="System Message"
            value={config.system_message || ''}
            onChange={(e) => handleConfigChange('system_message', e.target.value)}
            placeholder="Optional system message for the prompt..."
          />
        </Box>
      </Box>
    </Box>
  );

  const renderTransformConfig = () => (
    <Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 2 }}>
        <Box>
          <FormControl fullWidth>
            <InputLabel>Transform Type</InputLabel>
            <Select
              value={config.transform_type || 'format'}
              onChange={(e) => handleConfigChange('transform_type', e.target.value)}
            >
              <MenuItem value="format">Format Text</MenuItem>
              <MenuItem value="extract">Extract Data</MenuItem>
              <MenuItem value="parse">Parse JSON/XML</MenuItem>
              <MenuItem value="template">Apply Template</MenuItem>
              <MenuItem value="custom">Custom Script</MenuItem>
            </Select>
          </FormControl>
        </Box>
        
        <Box sx={{ gridColumn: '1 / -1' }}>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Transform Script"
            value={config.script || ''}
            onChange={(e) => handleConfigChange('script', e.target.value)}
            placeholder="Enter transformation logic or template..."
          />
        </Box>
        
        <Box sx={{ gridColumn: '1 / -1' }}>
          <FormControlLabel
            control={
              <Switch
                checked={config.preserve_original || false}
                onChange={(e) => handleConfigChange('preserve_original', e.target.checked)}
              />
            }
            label="Preserve Original Data"
          />
        </Box>
      </Box>
    </Box>
  );

  const renderFilterConfig = () => (
    <Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 2 }}>
        <Box sx={{ gridColumn: '1 / -1' }}>
          <FormControl fullWidth>
            <InputLabel>Filter Type</InputLabel>
            <Select
              value={config.filter_type || 'length'}
              onChange={(e) => handleConfigChange('filter_type', e.target.value)}
            >
              <MenuItem value="length">Text Length</MenuItem>
              <MenuItem value="quality">Quality Score</MenuItem>
              <MenuItem value="regex">Regex Pattern</MenuItem>
              <MenuItem value="sentiment">Sentiment</MenuItem>
              <MenuItem value="custom">Custom Filter</MenuItem>
            </Select>
          </FormControl>
        </Box>
        
        <Box>
          <TextField
            fullWidth
            label="Minimum Value"
            type="number"
            value={config.min_value || 0}
            onChange={(e) => handleConfigChange('min_value', parseFloat(e.target.value))}
          />
        </Box>
        
        <Box>
          <TextField
            fullWidth
            label="Maximum Value"
            type="number"
            value={config.max_value || 100}
            onChange={(e) => handleConfigChange('max_value', parseFloat(e.target.value))}
          />
        </Box>
        
        <Box sx={{ gridColumn: '1 / -1' }}>
          <TextField
            fullWidth
            label="Filter Expression"
            value={config.expression || ''}
            onChange={(e) => handleConfigChange('expression', e.target.value)}
            placeholder="Enter filter expression or regex pattern..."
          />
        </Box>
        
        <Box sx={{ gridColumn: '1 / -1' }}>
          <FormControlLabel
            control={
              <Switch
                checked={config.reject_mode || false}
                onChange={(e) => handleConfigChange('reject_mode', e.target.checked)}
              />
            }
            label="Reject Mode (exclude matching items)"
          />
        </Box>
      </Box>
    </Box>
  );

  const renderApiConfig = () => (
    <Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 2 }}>
        <Box sx={{ gridColumn: '1 / -1' }}>
          <TextField
            fullWidth
            label="API Endpoint"
            value={config.endpoint || ''}
            onChange={(e) => handleConfigChange('endpoint', e.target.value)}
            placeholder="https://api.example.com/endpoint"
          />
        </Box>
        
        <Box>
          <FormControl fullWidth>
            <InputLabel>HTTP Method</InputLabel>
            <Select
              value={config.method || 'GET'}
              onChange={(e) => handleConfigChange('method', e.target.value)}
            >
              <MenuItem value="GET">GET</MenuItem>
              <MenuItem value="POST">POST</MenuItem>
              <MenuItem value="PUT">PUT</MenuItem>
              <MenuItem value="DELETE">DELETE</MenuItem>
            </Select>
          </FormControl>
        </Box>
        
        <Box>
          <TextField
            fullWidth
            label="Timeout (ms)"
            type="number"
            value={config.timeout || 5000}
            onChange={(e) => handleConfigChange('timeout', parseInt(e.target.value))}
          />
        </Box>
        
        <Box sx={{ gridColumn: '1 / -1' }}>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Headers (JSON)"
            value={config.headers || ''}
            onChange={(e) => handleConfigChange('headers', e.target.value)}
            placeholder='{"Authorization": "Bearer token", "Content-Type": "application/json"}'
          />
        </Box>
        
        <Box sx={{ gridColumn: '1 / -1' }}>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Request Body"
            value={config.body || ''}
            onChange={(e) => handleConfigChange('body', e.target.value)}
            placeholder="Enter request body (for POST/PUT requests)..."
          />
        </Box>
      </Box>
    </Box>
  );

  const renderDatabaseConfig = () => (
    <Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 2 }}>
        <Box>
          <FormControl fullWidth>
            <InputLabel>Database Type</InputLabel>
            <Select
              value={config.db_type || 'postgresql'}
              onChange={(e) => handleConfigChange('db_type', e.target.value)}
            >
              <MenuItem value="postgresql">PostgreSQL</MenuItem>
              <MenuItem value="mysql">MySQL</MenuItem>
              <MenuItem value="sqlite">SQLite</MenuItem>
              <MenuItem value="mongodb">MongoDB</MenuItem>
            </Select>
          </FormControl>
        </Box>
        
        <Box>
          <TextField
            fullWidth
            label="Connection String"
            value={config.connection_string || ''}
            onChange={(e) => handleConfigChange('connection_string', e.target.value)}
            placeholder="postgresql://user:password@host:port/database"
          />
        </Box>
        
        <Box sx={{ gridColumn: '1 / -1' }}>
          <TextField
            fullWidth
            label="Query"
            value={config.query || ''}
            onChange={(e) => handleConfigChange('query', e.target.value)}
            placeholder="SELECT * FROM table WHERE condition"
            multiline
            rows={4}
          />
        </Box>
        
        <Box>
          <FormControlLabel
            control={
              <Switch
                checked={config.use_pool || false}
                onChange={(e) => handleConfigChange('use_pool', e.target.checked)}
              />
            }
            label="Use Connection Pool"
          />
        </Box>
        
        <Box>
          <TextField
            fullWidth
            label="Pool Size"
            type="number"
            value={config.pool_size || 10}
            onChange={(e) => handleConfigChange('pool_size', parseInt(e.target.value))}
          />
        </Box>
      </Box>
    </Box>
  );

  const renderConditionConfig = () => (
    <Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 2 }}>
        <Box>
          <TextField
            fullWidth
            label="Condition Expression"
            value={config.expression || ''}
            onChange={(e) => handleConfigChange('expression', e.target.value)}
            placeholder="data.score > 0.8 && data.category === 'important'"
            multiline
            rows={3}
          />
        </Box>
        
        <Box>
          <FormControlLabel
            control={
              <Switch
                checked={config.strict_mode || false}
                onChange={(e) => handleConfigChange('strict_mode', e.target.checked)}
              />
            }
            label="Strict Mode (fail on expression errors)"
          />
        </Box>
      </Box>
    </Box>
  );

  const renderLoopConfig = () => (
    <Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 2 }}>
        <Box>
          <TextField
            fullWidth
            label="Items Path"
            value={config.items_path || ''}
            onChange={(e) => handleConfigChange('items_path', e.target.value)}
            placeholder="data.items"
          />
        </Box>
        
        <Box>
          <TextField
            fullWidth
            label="Item Variable Name"
            value={config.item_variable || 'item'}
            onChange={(e) => handleConfigChange('item_variable', e.target.value)}
          />
        </Box>
        
        <Box sx={{ gridColumn: '1 / -1' }}>
          <FormControlLabel
            control={
              <Switch
                checked={config.parallel || false}
                onChange={(e) => handleConfigChange('parallel', e.target.checked)}
              />
            }
            label="Parallel Execution"
          />
        </Box>
        
        <Box>
          <TextField
            fullWidth
            label="Max Concurrency"
            type="number"
            value={config.max_concurrency || 5}
            onChange={(e) => handleConfigChange('max_concurrency', parseInt(e.target.value))}
          />
        </Box>
      </Box>
    </Box>
  );

  const renderAnalysisConfig = () => (
    <Box>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <FormControl fullWidth>
            <InputLabel>Analysis Type</InputLabel>
            <Select
              value={config.analysis_type || 'sentiment'}
              onChange={(e) => handleConfigChange('analysis_type', e.target.value)}
            >
              <MenuItem value="sentiment">Sentiment Analysis</MenuItem>
              <MenuItem value="quality">Quality Score</MenuItem>
              <MenuItem value="relevance">Relevance Score</MenuItem>
              <MenuItem value="toxicity">Toxicity Detection</MenuItem>
              <MenuItem value="custom">Custom Analysis</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12}>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Analysis Criteria"
            value={config.criteria || ''}
            onChange={(e) => handleConfigChange('criteria', e.target.value)}
            placeholder="Define analysis criteria or scoring rubric..."
          />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Score Threshold"
            type="number"
            value={config.threshold || 0.5}
            onChange={(e) => handleConfigChange('threshold', parseFloat(e.target.value))}
            inputProps={{ min: 0, max: 1, step: 0.1 }}
          />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Output Format</InputLabel>
            <Select
              value={config.output_format || 'score'}
              onChange={(e) => handleConfigChange('output_format', e.target.value)}
            >
              <MenuItem value="score">Numeric Score</MenuItem>
              <MenuItem value="category">Category Label</MenuItem>
              <MenuItem value="detailed">Detailed Report</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>
    </Box>
  );

  const renderConfigForm = () => {
    switch (node.data.type) {
      case 'prompt':
        return renderPromptConfig();
      case 'transform':
        return renderTransformConfig();
      case 'filter':
        return renderFilterConfig();
      case 'api':
        return renderApiConfig();
      case 'analysis':
        return renderAnalysisConfig();
      default:
        return (
          <Typography color="text.secondary">
            No configuration options available for this step type.
          </Typography>
        );
    }
  };

  return (
    <Card
      sx={{
        position: 'absolute',
        top: 16,
        right: 16,
        width: 400,
        maxHeight: 'calc(100vh - 200px)',
        overflow: 'auto',
        zIndex: 1000,
        boxShadow: theme.shadows[8],
      }}
    >
      <CardHeader
        title={
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {getStepIcon(node.data.type)}
            <Typography variant="h6" sx={{ ml: 1 }}>
              Configure Step
            </Typography>
          </Box>
        }
        action={
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        }
        sx={{
          backgroundColor: alpha(theme.palette.primary.main, 0.1),
        }}
      />
      
      <CardContent>
        {/* Basic Settings */}
        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            label="Step Name"
            value={nodeName}
            onChange={(e) => setNodeName(e.target.value)}
            sx={{ mb: 2 }}
          />
          
          <Chip
            label={`Type: ${node.data.type}`}
            variant="outlined"
            color="primary"
            size="small"
          />
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Step-specific Configuration */}
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography variant="subtitle1">
              Step Configuration
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            {renderConfigForm()}
          </AccordionDetails>
        </Accordion>

        {/* Error Handling */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography variant="subtitle1">
              Error Handling
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>On Error</InputLabel>
                  <Select
                    value={config.on_error || 'fail'}
                    onChange={(e) => handleConfigChange('on_error', e.target.value)}
                  >
                    <MenuItem value="fail">Fail Pipeline</MenuItem>
                    <MenuItem value="skip">Skip Step</MenuItem>
                    <MenuItem value="retry">Retry Step</MenuItem>
                    <MenuItem value="default">Use Default Value</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              {config.on_error === 'default' && (
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Default Value"
                    value={config.default_value || ''}
                    onChange={(e) => handleConfigChange('default_value', e.target.value)}
                  />
                </Grid>
              )}
            </Grid>
          </AccordionDetails>
        </Accordion>

        {/* Output Settings */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography variant="subtitle1">
              Output Settings
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Output Variable Name"
                  value={config.output_var || `${node.data.type}_output`}
                  onChange={(e) => handleConfigChange('output_var', e.target.value)}
                />
              </Grid>
              
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={config.cache_output || false}
                      onChange={(e) => handleConfigChange('cache_output', e.target.checked)}
                    />
                  }
                  label="Cache Output"
                />
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>

        {/* Actions */}
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
          <Button variant="outlined" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSave}>
            Save
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default StepConfigPanel;