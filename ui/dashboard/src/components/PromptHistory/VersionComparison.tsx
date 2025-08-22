import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Button,
  Chip,
  Paper,
  Divider,
  Tabs,
  Tab,
  IconButton,
  useTheme,
  alpha,
} from '@mui/material';
import {
  ArrowBack,
  SwapHoriz,
  Download,
  Code,
  DataObject,
  Settings,
  Assessment,
  CheckCircle,
  Cancel,
  ChangeCircle,
} from '@mui/icons-material';
import { PromptVersion } from '../../types';

interface VersionComparisonProps {
  versionA: PromptVersion & { prompt_data?: any };
  versionB: PromptVersion & { prompt_data?: any };
  differences: {
    changed_fields: string[];
    additions: Record<string, any>;
    deletions: Record<string, any>;
    modifications: Record<string, any>;
  };
  onBack: () => void;
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
    id={`comparison-tabpanel-${index}`}
    aria-labelledby={`comparison-tab-${index}`}
    {...other}
  >
    {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
  </div>
);

const VersionComparison: React.FC<VersionComparisonProps> = ({
  versionA,
  versionB,
  differences,
  onBack,
}) => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [swapped, setSwapped] = useState(false);

  // Swap versions for comparison
  const leftVersion = swapped ? versionB : versionA;
  const rightVersion = swapped ? versionA : versionB;

  const handleSwap = () => {
    setSwapped(!swapped);
  };

  const handleExportComparison = () => {
    const exportData = {
      comparison: {
        version_a: versionA,
        version_b: versionB,
        differences,
      },
      exported_at: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `version-comparison-${versionA.version}-vs-${versionB.version}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

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

  const getDifferenceIcon = (type: 'added' | 'removed' | 'modified') => {
    switch (type) {
      case 'added':
        return <CheckCircle sx={{ color: theme.palette.success.main }} />;
      case 'removed':
        return <Cancel sx={{ color: theme.palette.error.main }} />;
      case 'modified':
        return <ChangeCircle sx={{ color: theme.palette.warning.main }} />;
      default:
        return null;
    }
  };

  const renderVersionCard = (version: PromptVersion, side: 'left' | 'right') => (
    <Card sx={{ height: '100%', border: `2px solid ${alpha(theme.palette.primary.main, 0.2)}` }}>
      <CardHeader
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6">
              Version {version.version}
            </Typography>
            <Chip
              label={version.status || 'DRAFT'}
              size="small"
              sx={{
                backgroundColor: getStatusColor(version.status || 'DRAFT'),
                color: theme.palette.common.white,
              }}
            />
          </Box>
        }
        subheader={
          <Box>
            <Typography variant="body2" color="text.secondary">
              By {version.author || version.created_by} • {new Date(version.updated_at || version.created_at).toLocaleString()}
            </Typography>
            {version.commit_ref && (
              <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                {version.commit_ref.substring(0, 8)}
              </Typography>
            )}
          </Box>
        }
        sx={{
          backgroundColor: side === 'left' 
            ? alpha(theme.palette.info.main, 0.05)
            : alpha(theme.palette.success.main, 0.05),
        }}
      />
      <CardContent>
        {/* Version details would be rendered here based on prompt_data */}
        <Typography variant="body2" color="text.secondary">
          Detailed version data comparison will be displayed here.
        </Typography>
      </CardContent>
    </Card>
  );

  const renderDifferencesSummary = () => (
    <Card>
      <CardHeader
        title="Changes Summary"
        avatar={<Assessment color="primary" />}
      />
      <CardContent>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2, textAlign: 'center', backgroundColor: alpha(theme.palette.success.main, 0.1) }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                <CheckCircle sx={{ color: theme.palette.success.main, mr: 1 }} />
                <Typography variant="h6" color="success.main">
                  {Object.keys(differences.additions).length}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Additions
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2, textAlign: 'center', backgroundColor: alpha(theme.palette.error.main, 0.1) }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                <Cancel sx={{ color: theme.palette.error.main, mr: 1 }} />
                <Typography variant="h6" color="error.main">
                  {Object.keys(differences.deletions).length}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Deletions
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2, textAlign: 'center', backgroundColor: alpha(theme.palette.warning.main, 0.1) }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                <ChangeCircle sx={{ color: theme.palette.warning.main, mr: 1 }} />
                <Typography variant="h6" color="warning.main">
                  {Object.keys(differences.modifications).length}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Modifications
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* Changed Fields */}
        {differences.changed_fields.length > 0 && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Changed Fields:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {differences.changed_fields.map((field) => (
                <Chip
                  key={field}
                  label={field}
                  size="small"
                  variant="outlined"
                  color="primary"
                />
              ))}
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );

  const renderDetailedComparison = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Typography variant="h6" gutterBottom sx={{ color: theme.palette.info.main }}>
          Version {leftVersion.version} (Left)
        </Typography>
        {renderVersionCard(leftVersion, 'left')}
      </Grid>

      <Grid item xs={12} md={6}>
        <Typography variant="h6" gutterBottom sx={{ color: theme.palette.success.main }}>
          Version {rightVersion.version} (Right)
        </Typography>
        {renderVersionCard(rightVersion, 'right')}
      </Grid>
    </Grid>
  );

  const renderFieldByFieldComparison = () => (
    <Box>
      {/* Additions */}
      {Object.keys(differences.additions).length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardHeader
            title="Additions"
            avatar={<CheckCircle color="success" />}
            sx={{ backgroundColor: alpha(theme.palette.success.main, 0.1) }}
          />
          <CardContent>
            {Object.entries(differences.additions).map(([field, value]) => (
              <Box key={field} sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="success.main">
                  + {field}
                </Typography>
                <Paper sx={{ p: 1, mt: 1, backgroundColor: alpha(theme.palette.success.main, 0.05) }}>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                    {JSON.stringify(value, null, 2)}
                  </Typography>
                </Paper>
              </Box>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Deletions */}
      {Object.keys(differences.deletions).length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardHeader
            title="Deletions"
            avatar={<Cancel color="error" />}
            sx={{ backgroundColor: alpha(theme.palette.error.main, 0.1) }}
          />
          <CardContent>
            {Object.entries(differences.deletions).map(([field, value]) => (
              <Box key={field} sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="error.main">
                  - {field}
                </Typography>
                <Paper sx={{ p: 1, mt: 1, backgroundColor: alpha(theme.palette.error.main, 0.05) }}>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                    {JSON.stringify(value, null, 2)}
                  </Typography>
                </Paper>
              </Box>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Modifications */}
      {Object.keys(differences.modifications).length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardHeader
            title="Modifications"
            avatar={<ChangeCircle color="warning" />}
            sx={{ backgroundColor: alpha(theme.palette.warning.main, 0.1) }}
          />
          <CardContent>
            {Object.entries(differences.modifications).map(([field, change]) => (
              <Box key={field} sx={{ mb: 3 }}>
                <Typography variant="subtitle2" color="warning.main">
                  ~ {field}
                </Typography>
                
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="caption" color="error.main">
                      Before (v{leftVersion.version}):
                    </Typography>
                    <Paper sx={{ p: 1, mt: 0.5, backgroundColor: alpha(theme.palette.error.main, 0.05) }}>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                        {JSON.stringify((change as any)?.before, null, 2)}
                      </Typography>
                    </Paper>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Typography variant="caption" color="success.main">
                      After (v{rightVersion.version}):
                    </Typography>
                    <Paper sx={{ p: 1, mt: 0.5, backgroundColor: alpha(theme.palette.success.main, 0.05) }}>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                        {JSON.stringify((change as any)?.after, null, 2)}
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </Box>
            ))}
          </CardContent>
        </Card>
      )}
    </Box>
  );

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 3 }}>
        {/* Header */}
        <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton onClick={onBack} sx={{ mr: 2 }}>
              <ArrowBack />
            </IconButton>
            <Box>
              <Typography
                variant="h4"
                component="h1"
                gutterBottom
                sx={{
                  fontWeight: 700,
                  background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Version Comparison
              </Typography>
              <Typography variant="subtitle1" color="text.secondary">
                v{versionA.version} vs v{versionB.version}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<SwapHoriz />}
              onClick={handleSwap}
            >
              Swap Sides
            </Button>
            
            <Button
              variant="outlined"
              startIcon={<Download />}
              onClick={handleExportComparison}
            >
              Export
            </Button>
          </Box>
        </Box>

        {/* Summary */}
        <Box sx={{ mb: 3 }}>
          {renderDifferencesSummary()}
        </Box>

        {/* Comparison Tabs */}
        <Card>
          <Tabs
            value={activeTab}
            onChange={(_, newValue) => setActiveTab(newValue)}
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab icon={<DataObject />} label="Side by Side" />
            <Tab icon={<Code />} label="Field by Field" />
            <Tab icon={<Settings />} label="Raw Data" />
          </Tabs>

          <Box sx={{ p: 3 }}>
            <TabPanel value={activeTab} index={0}>
              {renderDetailedComparison()}
            </TabPanel>

            <TabPanel value={activeTab} index={1}>
              {renderFieldByFieldComparison()}
            </TabPanel>

            <TabPanel value={activeTab} index={2}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Version {versionA.version} Raw Data
                  </Typography>
                  <Paper sx={{ p: 2, backgroundColor: theme.palette.grey[50] }}>
                    <Typography
                      component="pre"
                      sx={{
                        fontFamily: 'monospace',
                        fontSize: '0.75rem',
                        overflow: 'auto',
                        maxHeight: 400,
                      }}
                    >
                      {JSON.stringify(versionA, null, 2)}
                    </Typography>
                  </Paper>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Version {versionB.version} Raw Data
                  </Typography>
                  <Paper sx={{ p: 2, backgroundColor: theme.palette.grey[50] }}>
                    <Typography
                      component="pre"
                      sx={{
                        fontFamily: 'monospace',
                        fontSize: '0.75rem',
                        overflow: 'auto',
                        maxHeight: 400,
                      }}
                    >
                      {JSON.stringify(versionB, null, 2)}
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </TabPanel>
          </Box>
        </Card>
      </Box>
    </Container>
  );
};

export default VersionComparison;