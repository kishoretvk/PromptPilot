import React, { useMemo } from 'react';
import {
  Box,
  Typography,
  Chip,
  Tooltip,
  IconButton,
  useTheme,
  Card,
  CardContent,
  CardHeader,
  Grid,
  Avatar,
} from '@mui/material';
import {
  Restore,
  CallSplit,
  Code,
  Person,
  Schedule,
  Merge,
  Label,
  ForkRight,
  Tag,
  History,
} from '@mui/icons-material';
import { PromptVersion } from '../../types';

interface VersionTimelineProps {
  versions: PromptVersion[];
  selectedVersions: string[];
  onVersionSelect: (versionId: string) => void;
  onRestoreVersion: (version: PromptVersion) => void;
  onTagVersion: (version: PromptVersion) => void;
  onBranchVersion: (version: PromptVersion) => void;
  onMergeVersion: (version: PromptVersion) => void;
  sourceVersion: PromptVersion | null;
  targetVersion: PromptVersion | null;
}

const VersionTimeline: React.FC<VersionTimelineProps> = ({
  versions,
  selectedVersions,
  onVersionSelect,
  onRestoreVersion,
  onTagVersion,
  onBranchVersion,
  onMergeVersion,
  sourceVersion,
  targetVersion,
}) => {
  const theme = useTheme();

  const sortedVersions = useMemo(() => {
    return [...versions].sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [versions]);

  const getStatusColor = (status?: string) => {
    if (!status) return theme.palette.grey[500];
    
    const colors: Record<string, string> = {
      DRAFT: theme.palette.warning.main,
      STAGING: theme.palette.info.main,
      PUBLISHED: theme.palette.success.main,
      ARCHIVED: theme.palette.grey[500],
      DEPRECATED: theme.palette.error.main,
    };
    
    return colors[status] || theme.palette.grey[500];
  };

  if (sortedVersions.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <History sx={{ fontSize: 48, color: theme.palette.grey[400], mb: 2 }} />
        <Typography color="text.secondary">
          No version history available
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ position: 'relative', pb: 4 }}>
      {/* Timeline line */}
      <Box
        sx={{
          position: 'absolute',
          left: 20,
          top: 0,
          bottom: 0,
          width: 2,
          bgcolor: theme.palette.divider,
        }}
      />

      <Grid container spacing={3}>
        {sortedVersions.map((version, index) => {
          const isSelected = selectedVersions.includes(version.id);
          const isLatest = index === 0;
          const isSource = sourceVersion?.id === version.id;
          const isTarget = targetVersion?.id === version.id;
          
          return (
            <Grid item xs={12} key={version.id}>
              <Box
                sx={{
                  position: 'relative',
                  display: 'flex',
                  mb: 2,
                  pl: 6,
                }}
              >
                {/* Timeline dot */}
                <Box
                  sx={{
                    position: 'absolute',
                    left: 12,
                    top: 20,
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    bgcolor: isSelected 
                      ? theme.palette.primary.main 
                      : isSource
                        ? theme.palette.warning.main
                        : isTarget
                          ? theme.palette.success.main
                          : isLatest 
                            ? theme.palette.success.main 
                            : theme.palette.grey[500],
                    border: `3px solid ${theme.palette.background.paper}`,
                    zIndex: 1,
                  }}
                />

                {/* Version card */}
                <Card
                  sx={{
                    flex: 1,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    border: isSelected 
                      ? `2px solid ${theme.palette.primary.main}` 
                      : isSource
                        ? `2px solid ${theme.palette.warning.main}`
                        : isTarget
                          ? `2px solid ${theme.palette.success.main}`
                          : `1px solid ${theme.palette.divider}`,
                    bgcolor: isSelected 
                      ? theme.palette.action.selected 
                      : theme.palette.background.paper,
                    '&:hover': {
                      boxShadow: 2,
                      borderColor: theme.palette.primary.light,
                    },
                  }}
                  onClick={() => onVersionSelect(version.id)}
                >
                  <CardHeader
                    avatar={
                      <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                        <Code />
                      </Avatar>
                    }
                    title={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="h6" component="div">
                          v{version.version}
                        </Typography>
                        {version.is_active && (
                          <Chip 
                            label="Active" 
                            size="small" 
                            color="success" 
                            variant="outlined" 
                            sx={{ height: 20 }} 
                          />
                        )}
                        {version.is_merge && (
                          <Chip 
                            label="Merge" 
                            size="small" 
                            color="info" 
                            variant="outlined" 
                            sx={{ height: 20 }} 
                          />
                        )}
                        {isLatest && (
                          <Chip 
                            label="Latest" 
                            size="small" 
                            color="info" 
                            variant="outlined" 
                            sx={{ height: 20 }} 
                          />
                        )}
                        {isSource && (
                          <Chip 
                            label="Source" 
                            size="small" 
                            color="warning" 
                            variant="outlined" 
                            sx={{ height: 20 }} 
                          />
                        )}
                        {isTarget && (
                          <Chip 
                            label="Target" 
                            size="small" 
                            color="success" 
                            variant="outlined" 
                            sx={{ height: 20 }} 
                          />
                        )}
                      </Box>
                    }
                    subheader={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Person sx={{ fontSize: 16 }} />
                          <Typography variant="caption">
                            {version.created_by || 'Unknown'}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Schedule sx={{ fontSize: 16 }} />
                          <Typography variant="caption">
                            {new Date(version.created_at).toLocaleString()}
                          </Typography>
                        </Box>
                      </Box>
                    }
                    action={
                      <Box sx={{ display: 'flex', gap: 0.5, mr: 1 }}>
                        <Tooltip title="Restore">
                          <IconButton onClick={(e) => {
                            e.stopPropagation();
                            onRestoreVersion(version);
                          }}>
                            <Restore />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Tag">
                          <IconButton onClick={(e) => {
                            e.stopPropagation();
                            onTagVersion(version);
                          }}>
                            <Label />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Branch">
                          <IconButton onClick={(e) => {
                            e.stopPropagation();
                            onBranchVersion(version);
                          }}>
                            <ForkRight />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Merge">
                          <IconButton onClick={(e) => {
                            e.stopPropagation();
                            onMergeVersion(version);
                          }}>
                            <Merge />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    }
                  />
                  <CardContent>
                    {version.commit_message && (
                      <Typography variant="body2" sx={{ mb: 2, fontStyle: 'italic' }}>
                        "{version.commit_message}"
                      </Typography>
                    )}
                    
                    {version.tags && version.tags.length > 0 && (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                        {version.tags.map((tag, tagIndex) => (
                          <Chip
                            key={tagIndex}
                            label={tag}
                            size="small"
                            icon={<Tag sx={{ fontSize: 16 }} />}
                            variant="outlined"
                          />
                        ))}
                      </Box>
                    )}
                    
                    {version.changes_summary && (
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          Changes:
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {version.changes_summary}
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Box>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
};

export default VersionTimeline;