import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  LinearProgress,
  Alert,
  Grid,
  Paper,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  IconButton,
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  Assessment as AssessmentIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Equalizer as EqualizerIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { useABTesting } from '../../hooks/useABTesting';

interface ABTestPanelProps {
  originalPrompt: Record<string, any>;
  refinedPrompt: Record<string, any>;
  onTestComplete?: (results: any) => void;
  autoStart?: boolean;
}

export const ABTestPanel: React.FC<ABTestPanelProps> = ({
  originalPrompt,
  refinedPrompt,
  onTestComplete,
  autoStart = false,
}) => {
  const [testId, setTestId] = useState<string | null>(null);

  const {
    startTest,
    stopTest,
    getTestStatus,
    getTestResults,
    isStarting,
    isStopping,
    isLoadingStatus,
    isLoadingResults,
    startError,
    stopError,
    statusError,
    resultsError,
    testStatus,
    testResults,
    resetStart,
    resetStop,
    resetStatus,
    resetResults,
  } = useABTesting();

  // Auto-start test if requested
  useEffect(() => {
    if (autoStart && originalPrompt && refinedPrompt && !testId) {
      handleStartTest();
    }
  }, [autoStart, originalPrompt, refinedPrompt, testId]);

  // Handle test completion
  useEffect(() => {
    if (testResults && testResults.is_complete) {
      onTestComplete?.(testResults);
    }
  }, [testResults, onTestComplete]);

  const handleStartTest = async () => {
    try {
      const result = await startTest({
        original_prompt: originalPrompt,
        refined_prompt: refinedPrompt,
        test_duration: 300, // 5 minutes default
        sample_size: 100, // 100 samples per variant
      });
      setTestId(result.test_id);
    } catch (error) {
      console.error('Failed to start A/B test:', error);
    }
  };

  const handleStopTest = async () => {
    if (!testId) return;

    try {
      await stopTest(testId);
    } catch (error) {
      console.error('Failed to stop A/B test:', error);
    }
  };

  const handleRefreshStatus = async () => {
    if (!testId) return;

    try {
      await getTestStatus(testId);
    } catch (error) {
      console.error('Failed to get test status:', error);
    }
  };

  const handleGetResults = async () => {
    if (!testId) return;

    try {
      await getTestResults(testId);
    } catch (error) {
      console.error('Failed to get test results:', error);
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'running':
        return 'primary';
      case 'completed':
        return 'success';
      case 'stopped':
        return 'warning';
      case 'failed':
        return 'error';
      default:
        return 'default';
    }
  };

  const getConfidenceColor = (confidence?: number) => {
    if (!confidence) return 'default';
    if (confidence >= 0.95) return 'success';
    if (confidence >= 0.80) return 'warning';
    return 'error';
  };

  const formatPercentage = (value?: number) => {
    if (value === undefined) return 'N/A';
    return `${(value * 100).toFixed(2)}%`;
  };

  const formatNumber = (value?: number) => {
    if (value === undefined) return 'N/A';
    return value.toLocaleString();
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <AssessmentIcon />
        A/B Testing
      </Typography>

      <Grid container spacing={3}>
        {/* Test Control Panel */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Test Controls
              </Typography>

              <Box sx={{ mb: 2 }}>
                {!testId ? (
                  <Button
                    variant="contained"
                    onClick={handleStartTest}
                    disabled={isStarting || !originalPrompt || !refinedPrompt}
                    startIcon={<PlayIcon />}
                    fullWidth
                  >
                    {isStarting ? 'Starting...' : 'Start A/B Test'}
                  </Button>
                ) : (
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant="outlined"
                      onClick={handleStopTest}
                      disabled={isStopping || testStatus?.status === 'completed'}
                      startIcon={<StopIcon />}
                      size="small"
                    >
                      {isStopping ? 'Stopping...' : 'Stop Test'}
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={handleRefreshStatus}
                      disabled={isLoadingStatus}
                      size="small"
                    >
                      Refresh
                    </Button>
                  </Box>
                )}
              </Box>

              {(startError || stopError || statusError) && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {startError || stopError || statusError}
                </Alert>
              )}

              {testStatus && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Test Status
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Chip
                      label={testStatus.status}
                      color={getStatusColor(testStatus.status)}
                      size="small"
                    />
                    {testStatus.status === 'running' && (
                      <LinearProgress sx={{ flex: 1, height: 4 }} />
                    )}
                  </Box>

                  <Typography variant="body2" color="text.secondary">
                    Progress: {formatPercentage(testStatus.progress)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Samples: {formatNumber(testStatus.samples_collected)} / {formatNumber(testStatus.target_samples)}
                  </Typography>
                  {testStatus.estimated_time_remaining && (
                    <Typography variant="body2" color="text.secondary">
                      ETA: {Math.round(testStatus.estimated_time_remaining / 60)}m
                    </Typography>
                  )}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Test Results Panel */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Test Results
                </Typography>
                {testId && testStatus?.status === 'completed' && (
                  <Button
                    variant="outlined"
                    onClick={handleGetResults}
                    disabled={isLoadingResults}
                    size="small"
                  >
                    {isLoadingResults ? 'Loading...' : 'Get Results'}
                  </Button>
                )}
              </Box>

              {resultsError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {resultsError}
                </Alert>
              )}

              {testResults ? (
                <Box>
                  {/* Summary Statistics */}
                  <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={12} sm={6} md={3}>
                      <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h4" color="primary">
                          {formatPercentage(testResults.winner === 'refined' ? testResults.refined_win_rate : testResults.original_win_rate)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Winner Rate
                        </Typography>
                      </Paper>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                      <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h4" color={getConfidenceColor(testResults.confidence_level)}>
                          {formatPercentage(testResults.confidence_level)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Confidence
                        </Typography>
                      </Paper>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                      <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h4" color={testResults.significant_improvement ? 'success.main' : 'text.primary'}>
                          {formatPercentage(testResults.improvement_percentage)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Improvement
                        </Typography>
                      </Paper>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                      <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h4">
                          {formatNumber(testResults.total_samples)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Total Samples
                        </Typography>
                      </Paper>
                    </Grid>
                  </Grid>

                  {/* Winner Announcement */}
                  {testResults.winner && (
                    <Alert
                      severity={testResults.significant_improvement ? 'success' : 'info'}
                      sx={{ mb: 3 }}
                      icon={testResults.significant_improvement ? <TrendingUpIcon /> : <EqualizerIcon />}
                    >
                      <Typography variant="subtitle1">
                        {testResults.winner === 'refined' ? 'Refined' : 'Original'} prompt wins!
                      </Typography>
                      {testResults.significant_improvement ? (
                        <Typography variant="body2">
                          The refined prompt shows statistically significant improvement of {formatPercentage(testResults.improvement_percentage)}.
                        </Typography>
                      ) : (
                        <Typography variant="body2">
                          No statistically significant difference was found between the prompts.
                        </Typography>
                      )}
                    </Alert>
                  )}

                  {/* Detailed Results Table */}
                  <Typography variant="h6" gutterBottom>
                    Detailed Results
                  </Typography>
                  <TableContainer component={Paper}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Variant</TableCell>
                          <TableCell align="right">Wins</TableCell>
                          <TableCell align="right">Win Rate</TableCell>
                          <TableCell align="right">Samples</TableCell>
                          <TableCell align="right">Avg Score</TableCell>
                          <TableCell align="right">Std Dev</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        <TableRow>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="body2">Original</Typography>
                              {testResults.winner === 'original' && (
                                <Chip label="Winner" color="success" size="small" />
                              )}
                            </Box>
                          </TableCell>
                          <TableCell align="right">{formatNumber(testResults.original_wins)}</TableCell>
                          <TableCell align="right">{formatPercentage(testResults.original_win_rate)}</TableCell>
                          <TableCell align="right">{formatNumber(testResults.original_samples)}</TableCell>
                          <TableCell align="right">{testResults.original_avg_score?.toFixed(3) || 'N/A'}</TableCell>
                          <TableCell align="right">{testResults.original_std_dev?.toFixed(3) || 'N/A'}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="body2">Refined</Typography>
                              {testResults.winner === 'refined' && (
                                <Chip label="Winner" color="success" size="small" />
                              )}
                            </Box>
                          </TableCell>
                          <TableCell align="right">{formatNumber(testResults.refined_wins)}</TableCell>
                          <TableCell align="right">{formatPercentage(testResults.refined_win_rate)}</TableCell>
                          <TableCell align="right">{formatNumber(testResults.refined_samples)}</TableCell>
                          <TableCell align="right">{testResults.refined_avg_score?.toFixed(3) || 'N/A'}</TableCell>
                          <TableCell align="right">{testResults.refined_std_dev?.toFixed(3) || 'N/A'}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>

                  {/* Statistical Details */}
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      Statistical Analysis
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Paper sx={{ p: 2 }}>
                          <Typography variant="subtitle2" gutterBottom>
                            Test Statistics
                          </Typography>
                          <Typography variant="body2">
                            p-value: {testResults.p_value?.toFixed(4) || 'N/A'}
                          </Typography>
                          <Typography variant="body2">
                            Effect Size: {testResults.effect_size?.toFixed(3) || 'N/A'}
                          </Typography>
                          <Typography variant="body2">
                            Test Type: {testResults.test_type || 'Chi-square'}
                          </Typography>
                        </Paper>
                      </Grid>

                      <Grid item xs={12} sm={6}>
                        <Paper sx={{ p: 2 }}>
                          <Typography variant="subtitle2" gutterBottom>
                            Confidence Intervals
                          </Typography>
                          <Typography variant="body2">
                            Original: [{formatPercentage(testResults.original_ci_lower)}, {formatPercentage(testResults.original_ci_upper)}]
                          </Typography>
                          <Typography variant="body2">
                            Refined: [{formatPercentage(testResults.refined_ci_lower)}, {formatPercentage(testResults.refined_ci_upper)}]
                          </Typography>
                        </Paper>
                      </Grid>
                    </Grid>
                  </Box>
                </Box>
              ) : testId ? (
                <Typography variant="body2" color="text.secondary">
                  {testStatus?.status === 'running'
                    ? 'Test is running. Results will be available when complete.'
                    : 'Click "Get Results" to view test outcomes.'}
                </Typography>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Start an A/B test to see comparative results between original and refined prompts.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};