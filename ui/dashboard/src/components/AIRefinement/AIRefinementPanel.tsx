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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  AutoFixHigh as RefineIcon,
  Analytics as AnalyticsIcon,
  Lightbulb as LightbulbIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useAIRefinement } from '../../hooks/useAIRefinement';
import { QualityScoreDisplay } from './QualityScoreDisplay';
import { AISuggestionsPanel } from './AISuggestionsPanel';

interface AIRefinementPanelProps {
  promptData: Record<string, any>;
  onRefinementComplete?: (refinedPrompt: Record<string, any>) => void;
  onQualityUpdate?: (qualityScore: any) => void;
}

export const AIRefinementPanel: React.FC<AIRefinementPanelProps> = ({
  promptData,
  onRefinementComplete,
  onQualityUpdate,
}) => {
  const [expandedPanel, setExpandedPanel] = useState<string | false>('analysis');
  const [lastAnalysis, setLastAnalysis] = useState<any>(null);

  const {
    refinePrompt,
    analyzeQuality,
    generateExamples,
    getProviders,
    isRefining,
    isAnalyzing,
    isGeneratingExamples,
    isLoadingProviders,
    refinementError,
    analysisError,
    examplesError,
    providersError,
    lastRefinement,
    lastAnalysis: hookLastAnalysis,
    lastExamples,
    providers,
    resetRefinement,
    resetAnalysis,
    resetExamples,
    resetProviders,
  } = useAIRefinement();

  // Update local state when analysis completes
  useEffect(() => {
    if (hookLastAnalysis) {
      setLastAnalysis(hookLastAnalysis);
      onQualityUpdate?.(hookLastAnalysis);
    }
  }, [hookLastAnalysis, onQualityUpdate]);

  // Handle refinement completion
  useEffect(() => {
    if (lastRefinement && lastRefinement.status === 'completed') {
      onRefinementComplete?.(lastRefinement.refined_prompt);
    }
  }, [lastRefinement, onRefinementComplete]);

  const handleAnalyzeQuality = async () => {
    try {
      await analyzeQuality(promptData);
    } catch (error) {
      console.error('Quality analysis failed:', error);
    }
  };

  const handleRefinePrompt = async () => {
    try {
      await refinePrompt({
        prompt_data: promptData,
        max_iterations: 3,
        quality_threshold: 0.8,
      });
    } catch (error) {
      console.error('Prompt refinement failed:', error);
    }
  };

  const handleGenerateExamples = async () => {
    if (!lastRefinement) return;

    try {
      await generateExamples({
        original_prompt: lastRefinement.original_prompt,
        refined_prompt: lastRefinement.refined_prompt,
      });
    } catch (error) {
      console.error('Example generation failed:', error);
    }
  };

  const handleLoadProviders = async () => {
    try {
      await getProviders();
    } catch (error) {
      console.error('Failed to load providers:', error);
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'failed':
        return 'error';
      case 'running':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon color="success" />;
      case 'failed':
        return <ErrorIcon color="error" />;
      case 'running':
        return <RefreshIcon color="warning" className="animate-spin" />;
      default:
        return null;
    }
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <RefineIcon />
        AI Prompt Refinement
      </Typography>

      <Grid container spacing={3}>
        {/* Quality Analysis Panel */}
        <Grid item xs={12} md={6}>
          <Card>
            <Accordion
              expanded={expandedPanel === 'analysis'}
              onChange={() => setExpandedPanel(expandedPanel === 'analysis' ? false : 'analysis')}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AnalyticsIcon />
                  <Typography variant="h6">Quality Analysis</Typography>
                  {isAnalyzing && <LinearProgress sx={{ width: 60, height: 4 }} />}
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Box sx={{ mb: 2 }}>
                  <Button
                    variant="contained"
                    onClick={handleAnalyzeQuality}
                    disabled={isAnalyzing}
                    startIcon={<AnalyticsIcon />}
                    fullWidth
                  >
                    {isAnalyzing ? 'Analyzing...' : 'Analyze Quality'}
                  </Button>
                </Box>

                {analysisError && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {analysisError}
                  </Alert>
                )}

                {lastAnalysis && (
                  <QualityScoreDisplay score={lastAnalysis.quality_score} />
                )}
              </AccordionDetails>
            </Accordion>
          </Card>
        </Grid>

        {/* AI Suggestions Panel */}
        <Grid item xs={12} md={6}>
          <Card>
            <Accordion
              expanded={expandedPanel === 'suggestions'}
              onChange={() => setExpandedPanel(expandedPanel === 'suggestions' ? false : 'suggestions')}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LightbulbIcon />
                  <Typography variant="h6">AI Suggestions</Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" color="text.secondary">
                  AI suggestions will be available after quality analysis.
                </Typography>
                {lastAnalysis?.quality_score?.suggestions && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Suggestions:
                    </Typography>
                    <List dense>
                      {lastAnalysis.quality_score.suggestions.map((suggestion: string, index: number) => (
                        <ListItem key={index}>
                          <ListItemIcon>
                            <LightbulbIcon color="primary" />
                          </ListItemIcon>
                          <ListItemText primary={suggestion} />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}
              </AccordionDetails>
            </Accordion>
          </Card>
        </Grid>

        {/* Automated Refinement Panel */}
        <Grid item xs={12}>
          <Card>
            <Accordion
              expanded={expandedPanel === 'refinement'}
              onChange={() => setExpandedPanel(expandedPanel === 'refinement' ? false : 'refinement')}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <RefineIcon />
                  <Typography variant="h6">Automated Refinement</Typography>
                  {lastRefinement && (
                    <Chip
                      label={lastRefinement.status}
                      color={getStatusColor(lastRefinement.status)}
                      size="small"
                      icon={getStatusIcon(lastRefinement.status) || undefined}
                    />
                  )}
                  {isRefining && <LinearProgress sx={{ width: 60, height: 4 }} />}
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Automatically refine your prompt through iterative AI analysis, quality improvement,
                    and A/B testing validation.
                  </Typography>

                  <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                    <Button
                      variant="contained"
                      onClick={handleRefinePrompt}
                      disabled={isRefining || !lastAnalysis}
                      startIcon={<RefineIcon />}
                      size="large"
                    >
                      {isRefining ? 'Refining...' : 'Start Refinement'}
                    </Button>

                    {lastRefinement && lastRefinement.status === 'completed' && (
                      <Button
                        variant="outlined"
                        onClick={handleGenerateExamples}
                        disabled={isGeneratingExamples}
                        startIcon={<LightbulbIcon />}
                      >
                        {isGeneratingExamples ? 'Generating...' : 'Generate Examples'}
                      </Button>
                    )}
                  </Box>
                </Box>

                {refinementError && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {refinementError}
                  </Alert>
                )}

                {lastRefinement && (
                  <Box sx={{ mt: 2 }}>
                    <Divider sx={{ mb: 2 }} />
                    <Typography variant="h6" gutterBottom>
                      Refinement Results
                    </Typography>

                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                          <Typography variant="subtitle2" color="text.secondary">
                            Iterations
                          </Typography>
                          <Typography variant="h4">
                            {lastRefinement.iterations}
                          </Typography>
                        </Paper>
                      </Grid>

                      <Grid item xs={12} sm={6}>
                        <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                          <Typography variant="subtitle2" color="text.secondary">
                            Quality Improvement
                          </Typography>
                          <Typography variant="h4" color="success.main">
                            +{(lastRefinement.quality_improvement * 100).toFixed(1)}%
                          </Typography>
                        </Paper>
                      </Grid>

                      <Grid item xs={12}>
                        <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                          <Typography variant="subtitle2" color="text.secondary">
                            Processing Time
                          </Typography>
                          <Typography variant="h6">
                            {lastRefinement.processing_time.toFixed(2)}s
                          </Typography>
                        </Paper>
                      </Grid>
                    </Grid>

                    {lastRefinement.ab_test_triggered && (
                      <Alert severity="info" sx={{ mt: 2 }}>
                        A/B testing was performed to validate the refinement improvements.
                      </Alert>
                    )}
                  </Box>
                )}

                {lastExamples && lastExamples.length > 0 && (
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      Generated Examples
                    </Typography>
                    {lastExamples.map((example: any, index: number) => (
                      <Card key={index} sx={{ mb: 2, p: 2 }}>
                        <Typography variant="subtitle1" gutterBottom>
                          {example.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {example.description}
                        </Typography>
                      </Card>
                    ))}
                  </Box>
                )}
              </AccordionDetails>
            </Accordion>
          </Card>
        </Grid>

        {/* Provider Information Panel */}
        <Grid item xs={12}>
          <Card>
            <Accordion
              expanded={expandedPanel === 'providers'}
              onChange={() => setExpandedPanel(expandedPanel === 'providers' ? false : 'providers')}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6">AI Providers</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Box sx={{ mb: 2 }}>
                  <Button
                    variant="outlined"
                    onClick={handleLoadProviders}
                    disabled={isLoadingProviders}
                    size="small"
                  >
                    {isLoadingProviders ? 'Loading...' : 'Load Providers'}
                  </Button>
                </Box>

                {providersError && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {providersError}
                  </Alert>
                )}

                {providers && (
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Available Providers ({providers.total_count})
                    </Typography>
                    <Grid container spacing={2}>
                      {providers.providers?.map((provider: any, index: number) => (
                        <Grid item xs={12} sm={6} md={4} key={index}>
                          <Paper sx={{ p: 2 }}>
                            <Typography variant="subtitle1">{provider.name}</Typography>
                            <Typography variant="body2" color="text.secondary">
                              Status: {provider.status}
                            </Typography>
                            {provider.models && (
                              <Typography variant="body2" color="text.secondary">
                                Models: {provider.models.join(', ')}
                              </Typography>
                            )}
                          </Paper>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                )}
              </AccordionDetails>
            </Accordion>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};