import React, { useState, useCallback, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  TextField,
  Button,
  Grid,
  Paper,
  Alert,
  IconButton,
  Collapse,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
} from '@mui/material';
import {
  PlayArrow,
  ExpandMore,
  ExpandLess,
  History,
  Assessment,
  DataObject,
  CheckCircle,
  Error,
  Warning,
  Timer,
  Memory,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { Prompt, TestResult } from '../../types';
import { useTestPrompt, usePromptTestHistory } from '../../hooks/usePrompts';

interface PromptTesterProps {
  prompt: Prompt;
  onEditPrompt?: () => void;
  onResultsChange?: (results: TestResult[]) => void;
}

interface TestExecution {
  id: string;
  timestamp: Date;
  inputs: Record<string, any>;
  output: string;
  metadata: {
    execution_time: number;
    token_count: number;
    cost: number;
    model_used: string;
  };
  status: 'success' | 'error' | 'timeout';
  error?: string;
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
    id={`tester-tabpanel-${index}`}
    aria-labelledby={`tester-tab-${index}`}
    {...other}
  >
    {value === index && <Box>{children}</Box>}
  </div>
);

const PromptTester: React.FC<PromptTesterProps> = ({
  prompt,
  onEditPrompt,
  onResultsChange,
}) => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [inputValues, setInputValues] = useState<Record<string, string>>({});
  const [selectedTestCase, setSelectedTestCase] = useState<string>('manual');
  const [isExpanded, setIsExpanded] = useState(false);
  const [executionHistory, setExecutionHistory] = useState<TestExecution[]>([]);
  const [currentExecution, setCurrentExecution] = useState<TestExecution | null>(null);

  const testPromptMutation = useTestPrompt();
  const { data: testHistory } = usePromptTestHistory(prompt.id);

  // Extract input variables from prompt messages
  const inputVariables = React.useMemo(() => {
    const variables = new Set<string>();
    prompt.messages.forEach(message => {
      const matches = message.content.match(/\{(\w+)\}/g);
      if (matches) {
        matches.forEach(match => {
          const variable = match.slice(1, -1);
          variables.add(variable);
        });
      }
    });
    return Array.from(variables);
  }, [prompt.messages]);

  useEffect(() => {
    // Initialize input values with empty strings
    const initialValues: Record<string, string> = {};
    inputVariables.forEach(variable => {
      initialValues[variable] = '';
    });
    setInputValues(initialValues);
  }, [inputVariables]);

  useEffect(() => {
    if (testHistory) {
      setExecutionHistory(testHistory);
    }
  }, [testHistory]);

  const handleInputChange = useCallback((variable: string, value: string) => {
    setInputValues(prev => ({
      ...prev,
      [variable]: value,
    }));
  }, []);

  const handleTestCaseSelect = useCallback((testCaseId: string) => {
    setSelectedTestCase(testCaseId);
  }, []);

  // Load test case inputs when test case changes
  useEffect(() => {
    if (selectedTestCase === 'manual') {
      // Reset to empty values for manual input
      const initialValues: Record<string, string> = {};
      inputVariables.forEach(variable => {
        initialValues[variable] = '';
      });
      setInputValues(initialValues);
    } else {
      // Load test case data
      const testCase = prompt.test_cases.find(tc => tc.name === selectedTestCase);
      if (testCase) {
        const testInputs: Record<string, string> = {};
        Object.entries(testCase.inputs || testCase.input_variables || {}).forEach(([key, value]) => {
          testInputs[key] = String(value);
        });
        setInputValues(testInputs);
      }
    }
  }, [inputVariables, prompt.test_cases, selectedTestCase]);

  const executePrompt = useCallback(async () => {
    try {
      setCurrentExecution({
        id: `exec_${Date.now()}`,
        timestamp: new Date(),
        inputs: inputValues,
        output: '',
        metadata: {
          execution_time: 0,
          token_count: 0,
          cost: 0,
          model_used: prompt.model_name,
        },
        status: 'success',
      });

      const startTime = Date.now();
      
      const result = await testPromptMutation.mutateAsync({
        id: prompt.id,
        testData: {
          prompt_id: prompt.id,
          input_variables: inputValues,
        }
      });

      const endTime = Date.now();
      const executionTime = endTime - startTime;

      const execution: TestExecution = {
        id: `exec_${startTime}`,
        timestamp: new Date(startTime),
        inputs: inputValues,
        output: result.output,
        metadata: {
          execution_time: executionTime,
          token_count: 0,
          cost: result.cost || 0,
          model_used: prompt.model_name,
        },
        status: 'success',
      };

      setCurrentExecution(execution);
      setExecutionHistory(prev => [execution, ...prev]);

      if (onResultsChange) {
        onResultsChange([result]);
      }
    } catch (error: any) {
      const execution: TestExecution = {
        id: `exec_${Date.now()}`,
        timestamp: new Date(),
        inputs: inputValues,
        output: '',
        metadata: {
          execution_time: 0,
          token_count: 0,
          cost: 0,
          model_used: prompt.model_name,
        },
        status: 'error',
        error: error.message,
      };

      setCurrentExecution(execution);
      setExecutionHistory(prev => [execution, ...prev]);
    }
  }, [inputValues, prompt, testPromptMutation, onResultsChange]);

  const runAllTestCases = useCallback(async () => {
    const results: TestResult[] = [];
    
    for (const testCase of prompt.test_cases) {
      try {
        const result = await testPromptMutation.mutateAsync({
          id: prompt.id,
          testData: {
            prompt_id: prompt.id,
            input_variables: testCase.inputs || testCase.input_variables || {},
            test_case_id: testCase.id,
          }
        });
        
        results.push({
          test_case_id: testCase.id,
          output: result.output,
          execution_time: result.execution_time,
          success: result.success,
          cost: result.cost,
        });
      } catch (error: any) {
        results.push({
          test_case_id: testCase.id,
          output: '',
          execution_time: 0,
          success: false,
          error: error.message,
        });
      }
    }

    if (onResultsChange) {
      onResultsChange(results);
    }
  }, [prompt, testPromptMutation, onResultsChange]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle color="success" />;
      case 'error':
        return <Error color="error" />;
      case 'timeout':
        return <Warning color="warning" />;
      default:
        return <CircularProgress size={20} />;
    }
  };

  const formatExecutionTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const isExecuting = testPromptMutation.isPending;
  const hasInputVariables = inputVariables.length > 0;

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5">
          Test Prompt: {prompt.name}
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="contained"
            startIcon={isExecuting ? <CircularProgress size={16} /> : <PlayArrow />}
            onClick={executePrompt}
            disabled={isExecuting || (hasInputVariables && Object.values(inputValues).some(v => !v.trim()))}
          >
            {isExecuting ? 'Running...' : 'Execute'}
          </Button>
          
          {prompt.test_cases.length > 0 && (
            <Button
              variant="outlined"
              startIcon={<Assessment />}
              onClick={runAllTestCases}
              disabled={isExecuting}
            >
              Run All Tests
            </Button>
          )}
        </Box>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3, flex: 1 }}>
        {/* Left Panel - Input Configuration */}
        <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <CardHeader
            title="Input Configuration"
            action={
              <IconButton onClick={() => setIsExpanded(!isExpanded)}>
                {isExpanded ? <ExpandLess /> : <ExpandMore />}
              </IconButton>
            }
          />
          
          <CardContent sx={{ flex: 1 }}>
            {/* Test Case Selection */}
            <Box sx={{ mb: 3 }}>
              <FormControl fullWidth>
                <InputLabel>Test Case</InputLabel>
                <Select
                  value={selectedTestCase}
                  onChange={(e) => handleTestCaseSelect(e.target.value)}
                >
                  <MenuItem value="manual">Manual Input</MenuItem>
                  {prompt.test_cases.map((testCase) => (
                    <MenuItem key={testCase.name} value={testCase.name}>
                      {testCase.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {/* Input Variables */}
            {hasInputVariables ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {inputVariables.map((variable) => (
                  <TextField
                    key={variable}
                    fullWidth
                    label={variable}
                    value={inputValues[variable] || ''}
                    onChange={(e) => handleInputChange(variable, e.target.value)}
                    multiline
                    rows={2}
                    placeholder={`Enter value for ${variable}...`}
                  />
                ))}
              </Box>
            ) : (
              <Alert severity="info">
                This prompt doesn't require any input variables. You can execute it directly.
              </Alert>
            )}

            {/* Prompt Preview */}
            <Collapse in={isExpanded}>
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Compiled Prompt Preview:
                </Typography>
                <Paper sx={{ p: 2, backgroundColor: theme.palette.grey[50] }}>
                  <Typography
                    component="pre"
                    sx={{
                      fontFamily: 'monospace',
                      fontSize: '0.75rem',
                      whiteSpace: 'pre-wrap',
                      maxHeight: 200,
                      overflow: 'auto',
                    }}
                  >
                    {prompt.messages
                      .sort((a, b) => (a.priority || 1) - (b.priority || 1))
                      .map(msg => {
                        let content = msg.content;
                        Object.entries(inputValues).forEach(([key, value]) => {
                          content = content.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
                        });
                        return `${msg.role.toUpperCase()}: ${content}`;
                      })
                      .join('\n\n')}

                  </Typography>
                </Paper>
              </Box>
            </Collapse>
          </CardContent>
        </Card>

        {/* Right Panel - Results and History */}
        <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Tabs
            value={activeTab}
            onChange={(_, newValue) => setActiveTab(newValue)}
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab icon={<DataObject />} label="Current Result" />
            <Tab icon={<History />} label="History" />
          </Tabs>

          {/* Current Result Tab */}
          <TabPanel value={activeTab} index={0}>
            <Box sx={{ p: 2 }}>
              {isExecuting && (
                <Box sx={{ mb: 2 }}>
                  <LinearProgress />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Executing prompt...
                  </Typography>
                </Box>
              )}

              {currentExecution ? (
                <Box>
                  {/* Execution Status */}
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    {getStatusIcon(currentExecution.status)}
                    <Typography variant="h6" sx={{ ml: 1 }}>
                      {currentExecution.status === 'success' ? 'Success' : 'Error'}
                    </Typography>
                  </Box>

                  {/* Metadata */}
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr' }, gap: 2, mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Timer fontSize="small" sx={{ mr: 1 }} />
                      <Typography variant="body2">
                        {formatExecutionTime(currentExecution.metadata.execution_time)}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Memory fontSize="small" sx={{ mr: 1 }} />
                      <Typography variant="body2">
                        {currentExecution.metadata.token_count} tokens
                      </Typography>
                    </Box>
                  </Box>

                  {/* Output */}
                  <Typography variant="subtitle2" gutterBottom>
                    Output:
                  </Typography>
                  <Paper sx={{ p: 2, backgroundColor: theme.palette.grey[50] }}>
                    {currentExecution.status === 'error' ? (
                      <Alert severity="error">
                        {currentExecution.error}
                      </Alert>
                    ) : (
                      <Typography
                        sx={{
                          whiteSpace: 'pre-wrap',
                          maxHeight: 300,
                          overflow: 'auto',
                        }}
                      >
                        {currentExecution.output}
                      </Typography>
                    )}
                  </Paper>
                </Box>
              ) : (
                <Typography color="text.secondary" textAlign="center" sx={{ py: 4 }}>
                  Execute the prompt to see results here.
                </Typography>
              )}
            </Box>
          </TabPanel>

          {/* History Tab */}
          <TabPanel value={activeTab} index={1}>
            <Box sx={{ p: 2 }}>
              {executionHistory.length > 0 ? (
                <TableContainer sx={{ maxHeight: 400 }}>
                  <Table stickyHeader size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Time</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Duration</TableCell>
                        <TableCell>Tokens</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {executionHistory.map((execution) => (
                        <TableRow
                          key={execution.id}
                          hover
                          onClick={() => setCurrentExecution(execution)}
                          sx={{ cursor: 'pointer' }}
                        >
                          <TableCell>
                            {execution.timestamp.toLocaleTimeString()}
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              {getStatusIcon(execution.status)}
                              <Typography variant="body2" sx={{ ml: 1 }}>
                                {execution.status}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            {formatExecutionTime(execution.metadata.execution_time)}
                          </TableCell>
                          <TableCell>
                            {execution.metadata.token_count}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography color="text.secondary" textAlign="center" sx={{ py: 4 }}>
                  No execution history yet.
                </Typography>
              )}
            </Box>
          </TabPanel>
        </Card>
      </Box>
    </Box>
  );
};

export default PromptTester;