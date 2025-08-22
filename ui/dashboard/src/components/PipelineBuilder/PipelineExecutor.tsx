import React, { useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CardHeader,
  Grid,
  TextField,
  LinearProgress,
  Alert,
  Paper,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Chip,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  useTheme,
  alpha,
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  Refresh as RefreshIcon,
  ExpandMore,
  CheckCircle,
  Error as ErrorIcon,
  Schedule,
  DataObject,
} from '@mui/icons-material';
import { Node, Edge } from 'reactflow';

interface ExecutionStep {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startTime?: Date;
  endTime?: Date;
  input?: any;
  output?: any;
  error?: string;
  duration?: number;
}

interface ExecutionResult {
  id: string;
  status: 'success' | 'failed' | 'cancelled';
  steps: ExecutionStep[];
  startTime: Date;
  endTime?: Date;
  totalDuration?: number;
  finalOutput?: any;
}

interface PipelineExecutorProps {
  nodes: Node[];
  edges: Edge[];
  onExecutionComplete?: (result: ExecutionResult) => void;
}

const PipelineExecutor: React.FC<PipelineExecutorProps> = ({
  nodes,
  edges,
  onExecutionComplete,
}) => {
  const theme = useTheme();
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null);
  const [inputData, setInputData] = useState<string>('{\n  "input": "Hello, world!"\n}');
  const [currentStep, setCurrentStep] = useState(0);

  // Convert nodes to execution steps
  const executionSteps = React.useMemo(() => {
    return nodes
      .filter(node => node.type === 'default')
      .map(node => ({
        id: node.id,
        name: node.data.label,
        status: 'pending' as const,
      }));
  }, [nodes]);

  const simulateStepExecution = useCallback(async (step: ExecutionStep, stepIndex: number): Promise<ExecutionStep> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Simulate different outcomes
        const success = Math.random() > 0.1; // 90% success rate
        
        const completedStep: ExecutionStep = {
          ...step,
          status: success ? 'completed' : 'failed',
          startTime: new Date(Date.now() - 2000),
          endTime: new Date(),
          duration: Math.floor(Math.random() * 3000) + 1000, // 1-4 seconds
          input: stepIndex === 0 ? JSON.parse(inputData) : `Output from step ${stepIndex}`,
          output: success ? `Result from ${step.name}` : undefined,
          error: success ? undefined : `Simulated error in ${step.name}`,
        };
        
        resolve(completedStep);
      }, Math.floor(Math.random() * 2000) + 1000); // 1-3 seconds delay
    });
  }, [inputData]);

  const executeStep = useCallback(async (step: ExecutionStep, stepIndex: number) => {
    // Update step to running
    setExecutionResult(prev => {
      if (!prev) return null;
      const updatedSteps = [...prev.steps];
      updatedSteps[stepIndex] = { ...step, status: 'running', startTime: new Date() };
      return { ...prev, steps: updatedSteps };
    });

    setCurrentStep(stepIndex);

    // Simulate step execution
    const completedStep = await simulateStepExecution(step, stepIndex);

    // Update step to completed/failed
    setExecutionResult(prev => {
      if (!prev) return null;
      const updatedSteps = [...prev.steps];
      updatedSteps[stepIndex] = completedStep;
      return { ...prev, steps: updatedSteps };
    });

    return completedStep;
  }, [simulateStepExecution]);

  const handleExecute = useCallback(async () => {
    if (executionSteps.length === 0) {
      alert('No steps to execute. Please add steps to the pipeline.');
      return;
    }

    try {
      JSON.parse(inputData);
    } catch {
      alert('Invalid JSON input data');
      return;
    }

    setIsExecuting(true);
    setCurrentStep(0);

    const startTime = new Date();
    const result: ExecutionResult = {
      id: `execution_${Date.now()}`,
      status: 'success',
      steps: executionSteps,
      startTime,
    };

    setExecutionResult(result);

    // Execute steps sequentially
    let allSuccessful = true;
    for (let i = 0; i < executionSteps.length; i++) {
      try {
        const completedStep = await executeStep(executionSteps[i], i);
        if (completedStep.status === 'failed') {
          allSuccessful = false;
          break;
        }
      } catch (error) {
        allSuccessful = false;
        break;
      }
    }

    const endTime = new Date();
    const finalResult: ExecutionResult = {
      ...result,
      status: allSuccessful ? 'success' : 'failed',
      endTime,
      totalDuration: endTime.getTime() - startTime.getTime(),
      finalOutput: allSuccessful ? 'Pipeline completed successfully' : 'Pipeline failed',
    };

    setExecutionResult(finalResult);
    setIsExecuting(false);
    onExecutionComplete?.(finalResult);
  }, [executionSteps, inputData, executeStep, onExecutionComplete]);

  const handleStop = useCallback(() => {
    setIsExecuting(false);
    if (executionResult) {
      const stoppedResult: ExecutionResult = {
        ...executionResult,
        status: 'cancelled',
        endTime: new Date(),
      };
      setExecutionResult(stoppedResult);
    }
  }, [executionResult]);

  const handleReset = useCallback(() => {
    setExecutionResult(null);
    setCurrentStep(0);
    setIsExecuting(false);
  }, []);

  const getStepIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle color="success" />;
      case 'failed':
        return <ErrorIcon color="error" />;
      case 'running':
        return <Schedule color="primary" />;
      default:
        return null;
    }
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  return (
    <Box sx={{ p: 3, height: '100%', overflow: 'auto' }}>
      <Grid container spacing={3}>
        {/* Input Configuration */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardHeader
              title="Input Data"
              avatar={<DataObject color="primary" />}
            />
            <CardContent>
              <TextField
                fullWidth
                multiline
                rows={8}
                label="Pipeline Input (JSON)"
                value={inputData}
                onChange={(e) => setInputData(e.target.value)}
                sx={{ mb: 2 }}
                disabled={isExecuting}
              />
              
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="contained"
                  startIcon={isExecuting ? <StopIcon /> : <PlayIcon />}
                  onClick={isExecuting ? handleStop : handleExecute}
                  fullWidth
                  color={isExecuting ? 'error' : 'primary'}
                >
                  {isExecuting ? 'Stop' : 'Execute Pipeline'}
                </Button>
                
                {executionResult && !isExecuting && (
                  <IconButton onClick={handleReset} color="primary">
                    <RefreshIcon />
                  </IconButton>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Execution Progress */}
        <Grid item xs={12} md={8}>
          <Card sx={{ height: 'fit-content' }}>
            <CardHeader
              title="Execution Progress"
              subheader={
                executionResult && (
                  <Box sx={{ mt: 1 }}>
                    <Chip
                      label={executionResult.status}
                      color={
                        executionResult.status === 'success' ? 'success' :
                        executionResult.status === 'failed' ? 'error' : 'default'
                      }
                      size="small"
                    />
                    {executionResult.totalDuration && (
                      <Typography variant="caption" sx={{ ml: 1 }}>
                        Total: {formatDuration(executionResult.totalDuration)}
                      </Typography>
                    )}
                  </Box>
                )
              }
            />
            <CardContent>
              {!executionResult ? (
                <Typography color="text.secondary" textAlign="center" sx={{ py: 4 }}>
                  Click "Execute Pipeline" to start execution
                </Typography>
              ) : (
                <Stepper activeStep={currentStep} orientation="vertical">
                  {executionResult.steps.map((step, index) => (
                    <Step key={step.id}>
                      <StepLabel
                        icon={getStepIcon(step.status)}
                        error={step.status === 'failed'}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="subtitle2">
                            {step.name}
                          </Typography>
                          {step.duration && (
                            <Chip
                              label={formatDuration(step.duration)}
                              size="small"
                              variant="outlined"
                            />
                          )}
                        </Box>
                      </StepLabel>
                      
                      <StepContent>
                        {step.status === 'running' && (
                          <Box sx={{ mt: 1, mb: 2 }}>
                            <LinearProgress />
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                              Executing step...
                            </Typography>
                          </Box>
                        )}
                        
                        {step.error && (
                          <Alert severity="error" sx={{ mt: 1, mb: 2 }}>
                            {step.error}
                          </Alert>
                        )}
                        
                        {(step.input || step.output) && (
                          <Accordion sx={{ mt: 1 }}>
                            <AccordionSummary expandIcon={<ExpandMore />}>
                              <Typography variant="body2">
                                Step Details
                              </Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                              {step.input && (
                                <Box sx={{ mb: 2 }}>
                                  <Typography variant="caption" color="text.secondary">
                                    Input:
                                  </Typography>
                                  <Paper sx={{ p: 1, mt: 0.5, backgroundColor: theme.palette.grey[50] }}>
                                    <Typography
                                      variant="body2"
                                      sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}
                                    >
                                      {typeof step.input === 'string' 
                                        ? step.input 
                                        : JSON.stringify(step.input, null, 2)
                                      }
                                    </Typography>
                                  </Paper>
                                </Box>
                              )}
                              
                              {step.output && (
                                <Box>
                                  <Typography variant="caption" color="text.secondary">
                                    Output:
                                  </Typography>
                                  <Paper sx={{ p: 1, mt: 0.5, backgroundColor: alpha(theme.palette.success.main, 0.05) }}>
                                    <Typography
                                      variant="body2"
                                      sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}
                                    >
                                      {typeof step.output === 'string' 
                                        ? step.output 
                                        : JSON.stringify(step.output, null, 2)
                                      }
                                    </Typography>
                                  </Paper>
                                </Box>
                              )}
                            </AccordionDetails>
                          </Accordion>
                        )}
                      </StepContent>
                    </Step>
                  ))}
                </Stepper>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Final Output */}
        {executionResult && executionResult.finalOutput && (
          <Grid item xs={12}>
            <Card>
              <CardHeader
                title="Pipeline Output"
                avatar={
                  executionResult.status === 'success' ? 
                    <CheckCircle color="success" /> : 
                    <ErrorIcon color="error" />
                }
              />
              <CardContent>
                <Paper sx={{ 
                  p: 2, 
                  backgroundColor: executionResult.status === 'success' 
                    ? alpha(theme.palette.success.main, 0.05)
                    : alpha(theme.palette.error.main, 0.05)
                }}>
                  <Typography
                    sx={{
                      fontFamily: 'monospace',
                      fontSize: '0.875rem',
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {typeof executionResult.finalOutput === 'string' 
                      ? executionResult.finalOutput 
                      : JSON.stringify(executionResult.finalOutput, null, 2)
                    }
                  </Typography>
                </Paper>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default PipelineExecutor;