import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  Paper,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Tooltip,
  Alert,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Lightbulb as LightbulbIcon,
  Compare as CompareIcon,
  ThumbUp as ThumbUpIcon,
  ThumbDown as ThumbDownIcon,
  Share as ShareIcon,
  Bookmark as BookmarkIcon,
  BookmarkBorder as BookmarkBorderIcon,
} from '@mui/icons-material';

interface RefinementExample {
  id: string;
  title: string;
  description: string;
  original_prompt: Record<string, any>;
  refined_prompt: Record<string, any>;
  improvement_type: string;
  quality_metrics: Record<string, any>;
  created_at?: string;
  upvotes?: number;
  downvotes?: number;
  user_vote?: 'up' | 'down' | null;
  bookmarked?: boolean;
}

interface ExampleGenerationPanelProps {
  examples: RefinementExample[];
  onGenerateExamples?: (originalPrompt: Record<string, any>, refinedPrompt: Record<string, any>) => void;
  onVoteExample?: (exampleId: string, vote: 'up' | 'down') => void;
  onBookmarkExample?: (exampleId: string, bookmarked: boolean) => void;
  onShareExample?: (exampleId: string) => void;
  isGenerating?: boolean;
  error?: string | null;
}

export const ExampleGenerationPanel: React.FC<ExampleGenerationPanelProps> = ({
  examples,
  onGenerateExamples,
  onVoteExample,
  onBookmarkExample,
  onShareExample,
  isGenerating = false,
  error = null,
}) => {
  const [selectedExample, setSelectedExample] = useState<RefinementExample | null>(null);
  const [compareDialogOpen, setCompareDialogOpen] = useState(false);

  const handleViewExample = (example: RefinementExample) => {
    setSelectedExample(example);
  };

  const handleCompareExample = (example: RefinementExample) => {
    setSelectedExample(example);
    setCompareDialogOpen(true);
  };

  const handleVote = (exampleId: string, vote: 'up' | 'down') => {
    onVoteExample?.(exampleId, vote);
  };

  const handleBookmark = (exampleId: string, currentlyBookmarked: boolean) => {
    onBookmarkExample?.(exampleId, !currentlyBookmarked);
  };

  const handleShare = (exampleId: string) => {
    onShareExample?.(exampleId);
  };

  const getImprovementColor = (improvementType: string) => {
    switch (improvementType.toLowerCase()) {
      case 'clarity':
        return 'primary';
      case 'specificity':
        return 'secondary';
      case 'context':
        return 'info';
      case 'safety':
        return 'warning';
      case 'structure':
        return 'success';
      default:
        return 'default';
    }
  };

  const formatPromptText = (prompt: Record<string, any>) => {
    // Extract the main prompt text from the prompt data structure
    return prompt.text || prompt.content || JSON.stringify(prompt, null, 2);
  };

  const calculateImprovement = (metrics: Record<string, any>) => {
    // Calculate overall improvement from quality metrics
    const beforeScore = metrics.before_score || 0;
    const afterScore = metrics.after_score || 0;
    return afterScore - beforeScore;
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <LightbulbIcon />
        Refinement Examples
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Examples List */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Generated Examples ({examples.length})
                </Typography>
                {onGenerateExamples && (
                  <Button
                    variant="outlined"
                    startIcon={<LightbulbIcon />}
                    disabled={isGenerating}
                    size="small"
                  >
                    {isGenerating ? 'Generating...' : 'Generate More'}
                  </Button>
                )}
              </Box>

              {examples.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                  No examples generated yet. Complete a successful refinement to generate examples.
                </Typography>
              ) : (
                <List>
                  {examples.map((example) => (
                    <ListItem
                      key={example.id}
                      sx={{
                        border: 1,
                        borderColor: 'divider',
                        borderRadius: 1,
                        mb: 2,
                        flexDirection: 'column',
                        alignItems: 'stretch',
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="subtitle1" gutterBottom>
                            {example.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            {example.description}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            <Chip
                              label={example.improvement_type}
                              color={getImprovementColor(example.improvement_type)}
                              size="small"
                            />
                            <Chip
                              label={`+${(calculateImprovement(example.quality_metrics) * 100).toFixed(1)}%`}
                              color="success"
                              size="small"
                              variant="outlined"
                            />
                          </Box>
                        </Box>

                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Tooltip title="View Details">
                            <IconButton
                              size="small"
                              onClick={() => handleViewExample(example)}
                            >
                              <ExpandMoreIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Compare Before/After">
                            <IconButton
                              size="small"
                              onClick={() => handleCompareExample(example)}
                            >
                              <CompareIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Bookmark">
                            <IconButton
                              size="small"
                              onClick={() => handleBookmark(example.id, example.bookmarked || false)}
                            >
                              {example.bookmarked ? <BookmarkIcon /> : <BookmarkBorderIcon />}
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Share">
                            <IconButton
                              size="small"
                              onClick={() => handleShare(example.id)}
                            >
                              <ShareIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Box>

                      {/* Voting Section */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                        <Tooltip title="Helpful">
                          <IconButton
                            size="small"
                            onClick={() => handleVote(example.id, 'up')}
                            color={example.user_vote === 'up' ? 'primary' : 'default'}
                          >
                            <ThumbUpIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Typography variant="body2" color="text.secondary">
                          {example.upvotes || 0}
                        </Typography>

                        <Tooltip title="Not Helpful">
                          <IconButton
                            size="small"
                            onClick={() => handleVote(example.id, 'down')}
                            color={example.user_vote === 'down' ? 'error' : 'default'}
                          >
                            <ThumbDownIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Typography variant="body2" color="text.secondary">
                          {example.downvotes || 0}
                        </Typography>
                      </Box>

                      {/* Expanded Details */}
                      {selectedExample?.id === example.id && (
                        <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                          <Typography variant="subtitle2" gutterBottom>
                            Quality Metrics
                          </Typography>
                          <Grid container spacing={1}>
                            {Object.entries(example.quality_metrics).map(([key, value]) => (
                              <Grid item xs={6} sm={3} key={key}>
                                <Paper sx={{ p: 1, textAlign: 'center' }}>
                                  <Typography variant="body2" color="text.secondary">
                                    {key.replace(/_/g, ' ')}
                                  </Typography>
                                  <Typography variant="body1">
                                    {typeof value === 'number' ? value.toFixed(2) : value}
                                  </Typography>
                                </Paper>
                              </Grid>
                            ))}
                          </Grid>
                        </Box>
                      )}
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Statistics Sidebar */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Example Statistics
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h4" color="primary">
                      {examples.length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Examples
                    </Typography>
                  </Paper>
                </Grid>

                <Grid item xs={6}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h4" color="success.main">
                      {examples.filter(ex => calculateImprovement(ex.quality_metrics) > 0).length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Successful
                    </Typography>
                  </Paper>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>
                    Improvement Types
                  </Typography>
                  {Object.entries(
                    examples.reduce((acc, ex) => {
                      acc[ex.improvement_type] = (acc[ex.improvement_type] || 0) + 1;
                      return acc;
                    }, {} as Record<string, number>)
                  ).map(([type, count]) => (
                    <Box key={type} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">{type}</Typography>
                      <Chip label={count} size="small" color={getImprovementColor(type)} />
                    </Box>
                  ))}
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Compare Dialog */}
      <Dialog
        open={compareDialogOpen}
        onClose={() => setCompareDialogOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          Before vs After Comparison
        </DialogTitle>
        <DialogContent>
          {selectedExample && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2, bgcolor: 'error.50', border: 1, borderColor: 'error.main' }}>
                  <Typography variant="h6" color="error.main" gutterBottom>
                    Original Prompt
                  </Typography>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                    {formatPromptText(selectedExample.original_prompt)}
                  </Typography>
                </Paper>
              </Grid>

              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2, bgcolor: 'success.50', border: 1, borderColor: 'success.main' }}>
                  <Typography variant="h6" color="success.main" gutterBottom>
                    Refined Prompt
                  </Typography>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                    {formatPromptText(selectedExample.refined_prompt)}
                  </Typography>
                </Paper>
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle1" gutterBottom>
                  Improvement Analysis
                </Typography>
                <Typography variant="body2" paragraph>
                  {selectedExample.description}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Chip
                    label={`Type: ${selectedExample.improvement_type}`}
                    color={getImprovementColor(selectedExample.improvement_type)}
                  />
                  <Chip
                    label={`Improvement: +${(calculateImprovement(selectedExample.quality_metrics) * 100).toFixed(1)}%`}
                    color="success"
                    variant="outlined"
                  />
                </Box>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCompareDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};