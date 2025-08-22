import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  IconButton,
  Checkbox,
  Tooltip,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Timeline,
  TimelineItem,
  TimelineOppositeContent,
  TimelineSeparator,
  TimelineDot,
  TimelineConnector,
  TimelineContent,
} from '@mui/lab';
import {
  Circle,
  Restore,
  Edit,
  Visibility,
  CheckCircle,
  RadioButtonUnchecked,
  Person,
  Schedule,
  Code,
  Note,
} from '@mui/icons-material';
import { PromptVersion, Prompt } from '../../types';

interface VersionTimelineProps {
  versions: PromptVersion[];
  selectedVersions: string[];
  onVersionSelect: (versionId: string) => void;
  onRestoreVersion: (version: PromptVersion) => void;
  onEditVersion?: (prompt: Prompt) => void;
}

const VersionTimeline: React.FC<VersionTimelineProps> = ({
  versions,
  selectedVersions,
  onVersionSelect,
  onRestoreVersion,
  onEditVersion,
}) => {
  const theme = useTheme();

  const getStatusColor = (status: string) => {
    const colors = {
      DRAFT: theme.palette.warning.main,
      STAGING: theme.palette.info.main,
      PUBLISHED: theme.palette.success.main,
      ARCHIVED: theme.palette.grey[500],
      DEPRECATED: theme.palette.error.main,
    };
    return colors[status as keyof typeof colors] || theme.palette.grey[500];
  };

  const getTimelineDotIcon = (version: PromptVersion, index: number) => {
    if (index === 0) {
      return <CheckCircle sx={{ color: theme.palette.success.main }} />;
    }
    
    switch (version.status) {
      case 'PUBLISHED':
        return <Circle sx={{ color: theme.palette.success.main }} />;
      case 'STAGING':
        return <Circle sx={{ color: theme.palette.info.main }} />;
      case 'DRAFT':
        return <Circle sx={{ color: theme.palette.warning.main }} />;
      case 'DEPRECATED':
        return <Circle sx={{ color: theme.palette.error.main }} />;
      default:
        return <Circle sx={{ color: theme.palette.grey[500] }} />;
    }
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = diffInMs / (1000 * 60 * 60);
    const diffInDays = diffInHours / 24;

    if (diffInHours < 1) {
      const minutes = Math.floor(diffInMs / (1000 * 60));
      return `${minutes} minutes ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} hours ago`;
    } else if (diffInDays < 7) {
      return `${Math.floor(diffInDays)} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  if (versions.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography color="text.secondary">
          No version history available for this prompt.
        </Typography>
      </Box>
    );
  }

  return (
    <Timeline position="right">
      {versions.map((version, index) => {
        const isSelected = selectedVersions.includes(version.version);
        const isLatest = index === 0;

        return (
          <TimelineItem key={version.version}>
            <TimelineOppositeContent
              sx={{ 
                m: 'auto 0', 
                minWidth: 120,
                textAlign: 'right',
                pr: 2,
              }}
              align="right"
              variant="body2"
              color="text.secondary"
            >
              <Typography variant="caption" display="block">
                {formatRelativeTime(version.updated_at)}
              </Typography>
              <Typography variant="caption" display="block">
                {new Date(version.updated_at).toLocaleTimeString()}
              </Typography>
            </TimelineOppositeContent>

            <TimelineSeparator>
              <TimelineDot
                sx={{
                  bgcolor: isSelected 
                    ? alpha(theme.palette.primary.main, 0.2)
                    : 'transparent',
                  border: isSelected 
                    ? `2px solid ${theme.palette.primary.main}`
                    : 'none',
                  p: isSelected ? 0.5 : 0,
                }}
              >
                {getTimelineDotIcon(version, index)}
              </TimelineDot>
              {index < versions.length - 1 && <TimelineConnector />}
            </TimelineSeparator>

            <TimelineContent sx={{ py: '12px', px: 2 }}>
              <Card
                sx={{
                  cursor: 'pointer',
                  transition: 'all 0.2s ease-in-out',
                  border: isSelected 
                    ? `2px solid ${theme.palette.primary.main}`
                    : `1px solid ${theme.palette.divider}`,
                  backgroundColor: isSelected
                    ? alpha(theme.palette.primary.main, 0.04)
                    : 'background.paper',
                  '&:hover': {
                    boxShadow: theme.shadows[4],
                    transform: 'translateY(-2px)',
                  },
                }}
                onClick={() => onVersionSelect(version.version)}
              >
                <CardContent sx={{ pb: 2 }}>
                  {/* Header */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Checkbox
                        checked={isSelected}
                        onChange={() => onVersionSelect(version.version)}
                        size="small"
                        icon={<RadioButtonUnchecked />}
                        checkedIcon={<CheckCircle />}
                        sx={{ mr: 1, p: 0 }}
                      />
                      
                      <Box>
                        <Typography variant="h6" component="div" sx={{ display: 'flex', alignItems: 'center' }}>
                          v{version.version}
                          {isLatest && (
                            <Chip
                              label="Latest"
                              size="small"
                              color="primary"
                              sx={{ ml: 1, height: 20 }}
                            />
                          )}
                        </Typography>
                      </Box>
                    </Box>

                    <Chip
                      label={version.status}
                      size="small"
                      sx={{
                        backgroundColor: getStatusColor(version.status),
                        color: theme.palette.common.white,
                        textTransform: 'capitalize',
                      }}
                    />
                  </Box>

                  {/* Version Details */}
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Person fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        {version.author}
                      </Typography>
                    </Box>

                    {version.commit_ref && (
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Code fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                        <Typography 
                          variant="body2" 
                          color="text.secondary"
                          sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}
                        >
                          {version.commit_ref.substring(0, 8)}
                        </Typography>
                      </Box>
                    )}

                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Schedule fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        Created: {new Date(version.created_at).toLocaleDateString()}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Actions */}
                  <Box sx={{ display: 'flex', gap: 1, pt: 1, borderTop: `1px solid ${theme.palette.divider}` }}>
                    <Tooltip title="View details">
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Handle view details
                        }}
                      >
                        <Visibility fontSize="small" />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title="Restore this version">
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRestoreVersion(version);
                        }}
                        color="primary"
                      >
                        <Restore fontSize="small" />
                      </IconButton>
                    </Tooltip>

                    {onEditVersion && (
                      <Tooltip title="Edit based on this version">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            // Create a minimal prompt object for editing
                            const promptForEdit: Prompt = {
                              id: `temp_${version.version}`,
                              name: `Prompt v${version.version}`,
                              description: '',
                              task_type: 'text_generation',
                              tags: [],
                              version_info: version,
                              messages: [],
                              input_variables: {},
                              model_provider: 'openai',
                              model_name: 'gpt-3.5-turbo',
                              parameters: {},
                              test_cases: [],
                              evaluation_metrics: {},
                              execution_order: [],
                              fallback_prompts: [],
                              rate_limits: {},
                              deployment_targets: [],
                              custom_fields: {},
                            };
                            onEditVersion(promptForEdit);
                          }}
                          color="primary"
                        >
                          <Edit fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>

                  {/* Version Notes/Changes */}
                  {/* This would be populated from actual version data if available */}
                  {index === 0 && (
                    <Box sx={{ mt: 2, p: 1, backgroundColor: alpha(theme.palette.success.main, 0.1), borderRadius: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Note fontSize="small" sx={{ mr: 1, color: theme.palette.success.main }} />
                        <Typography variant="caption" color="text.secondary">
                          Current active version
                        </Typography>
                      </Box>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </TimelineContent>
          </TimelineItem>
        );
      })}
    </Timeline>
  );
};

export default VersionTimeline;