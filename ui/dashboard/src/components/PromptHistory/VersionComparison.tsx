import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  useTheme,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  ArrowBack,
  Code,
  Person,
  Schedule,
  Difference,
  ExpandMore,
  Add,
  Remove,
  Edit,
} from '@mui/icons-material';
import ReactDiffViewer from 'react-diff-viewer';
import { VersionComparisonResponse } from '../../types/Prompt';

interface VersionComparisonProps {
  versionA: any;
  versionB: any;
  differences: any[];
  summary: VersionComparisonResponse['summary'];
  onBack: () => void;
}

const VersionComparison: React.FC<VersionComparisonProps> = ({
  versionA,
  versionB,
  differences,
  summary,
  onBack,
}) => {
  const theme = useTheme();
  const [filter, setFilter] = useState<string>('all');
  const [expandedFields, setExpandedFields] = useState<Record<string, boolean>>({});

  const formatContentForDiff = (content: any) => {
    return JSON.stringify(content, null, 2);
  };

  const oldContent = formatContentForDiff(versionA?.content_snapshot || {});
  const newContent = formatContentForDiff(versionB?.content_snapshot || {});

  const toggleFieldExpansion = (field: string) => {
    setExpandedFields(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const getDiffIcon = (type: string) => {
    switch (type) {
      case 'added': return <Add sx={{ color: theme.palette.success.main }} />;
      case 'removed': return <Remove sx={{ color: theme.palette.error.main }} />;
      case 'modified': return <Edit sx={{ color: theme.palette.warning.main }} />;
      default: return null;
    }
  };

  const getDiffColor = (type: string) => {
    switch (type) {
      case 'added': return theme.palette.success.light;
      case 'removed': return theme.palette.error.light;
      case 'modified': return theme.palette.warning.light;
      default: return theme.palette.grey[100];
    }
  };

  const filteredDifferences = filter === 'all' 
    ? differences 
    : differences.filter(diff => diff.type === filter);

  // Fix: Access field_statistics from the summary prop
  const fieldStatistics = summary?.field_statistics || {
    messages: { added: 0, modified: 0, removed: 0 },
    parameters: { added: 0, modified: 0, removed: 0 },
    input_variables: { added: 0, modified: 0, removed: 0 },
    other_fields: { added: 0, modified: 0, removed: 0 }
  };

  return (
    <Box sx={{ py: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <IconButton onClick={onBack} sx={{ mr: 2 }}>
          <ArrowBack />
        </IconButton>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Version Comparison
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Comparing v{versionA?.version} with v{versionB?.version}
          </Typography>
        </Box>
      </Box>

      {/* Version Info Cards */}
      <Box sx={{ display: 'flex', gap: 3, mb: 4 }}>
        <Paper sx={{ flex: 1, p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                bgcolor: theme.palette.primary.main,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: theme.palette.primary.contrastText,
                mr: 2,
              }}
            >
              <Code />
            </Box>
            <Box>
              <Typography variant="h6">Version {versionA?.version}</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                <Person sx={{ fontSize: 16 }} />
                <Typography variant="caption">
                  {versionA?.created_by || 'Unknown'}
                </Typography>
                <Schedule sx={{ fontSize: 16, ml: 1 }} />
                <Typography variant="caption">
                  {new Date(versionA?.created_at).toLocaleDateString()}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Paper>

        <Paper sx={{ flex: 1, p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                bgcolor: theme.palette.secondary.main,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: theme.palette.secondary.contrastText,
                mr: 2,
              }}
            >
              <Code />
            </Box>
            <Box>
              <Typography variant="h6">Version {versionB?.version}</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                <Person sx={{ fontSize: 16 }} />
                <Typography variant="caption">
                  {versionB?.created_by || 'Unknown'}
                </Typography>
                <Schedule sx={{ fontSize: 16, ml: 1 }} />
                <Typography variant="caption">
                  {new Date(versionB?.created_at).toLocaleDateString()}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Paper>
      </Box>

      {/* Summary of Changes */}
      <Paper sx={{ mb: 4, p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Difference sx={{ mr: 1 }} />
          <Typography variant="h6">Change Summary</Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
          <Chip 
            label={`${differences.filter(d => d.type === 'modified').length} Modified`} 
            color="warning" 
            variant="outlined" 
          />
          <Chip 
            label={`${differences.filter(d => d.type === 'added').length} Added`} 
            color="success" 
            variant="outlined" 
          />
          <Chip 
            label={`${differences.filter(d => d.type === 'removed').length} Removed`} 
            color="error" 
            variant="outlined" 
          />
        </Box>
        
        {/* Field Statistics */}
        <Accordion sx={{ mb: 2 }}>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography>Field Statistics</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Field Type</TableCell>
                    <TableCell>Added</TableCell>
                    <TableCell>Modified</TableCell>
                    <TableCell>Removed</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell>Messages</TableCell>
                    <TableCell>{fieldStatistics.messages.added}</TableCell>
                    <TableCell>{fieldStatistics.messages.modified}</TableCell>
                    <TableCell>{fieldStatistics.messages.removed}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Parameters</TableCell>
                    <TableCell>{fieldStatistics.parameters.added}</TableCell>
                    <TableCell>{fieldStatistics.parameters.modified}</TableCell>
                    <TableCell>{fieldStatistics.parameters.removed}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Input Variables</TableCell>
                    <TableCell>{fieldStatistics.input_variables.added}</TableCell>
                    <TableCell>{fieldStatistics.input_variables.modified}</TableCell>
                    <TableCell>{fieldStatistics.input_variables.removed}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Other Fields</TableCell>
                    <TableCell>{fieldStatistics.other_fields.added}</TableCell>
                    <TableCell>{fieldStatistics.other_fields.modified}</TableCell>
                    <TableCell>{fieldStatistics.other_fields.removed}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </AccordionDetails>
        </Accordion>
        
        {differences.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Typography variant="subtitle2">
                Changed Fields:
              </Typography>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Filter</InputLabel>
                <Select
                  value={filter}
                  label="Filter"
                  onChange={(e) => setFilter(e.target.value as string)}
                >
                  <MenuItem value="all">All Changes</MenuItem>
                  <MenuItem value="modified">Modified</MenuItem>
                  <MenuItem value="added">Added</MenuItem>
                  <MenuItem value="removed">Removed</MenuItem>
                </Select>
              </FormControl>
            </Box>

            {/* Differences List */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {filteredDifferences.map((diff, index) => (
                <Paper key={index} sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    {getDiffIcon(diff.type)}
                    <Typography variant="subtitle2" sx={{ ml: 1 }}>
                      {diff.field} ({diff.type})
                    </Typography>
                  </Box>
                  
                  {diff.diff ? (
                    <ReactDiffViewer
                      oldValue={diff.version1 ? JSON.stringify(diff.version1, null, 2) : ''}
                      newValue={diff.version2 ? JSON.stringify(diff.version2, null, 2) : ''}
                      splitView={true}
                      disableWordDiff={false}
                      useDarkTheme={theme.palette.mode === 'dark'}
                      styles={{
                        variables: {
                          dark: {
                            diffViewerBackground: theme.palette.grey[900],
                            diffViewerColor: theme.palette.common.white,
                            addedBackground: theme.palette.success.dark,
                            addedColor: theme.palette.common.white,
                            removedBackground: theme.palette.error.dark,
                            removedColor: theme.palette.common.white,
                            wordAddedBackground: theme.palette.success.light,
                            wordRemovedBackground: theme.palette.error.light,
                            addedGutterBackground: theme.palette.success.main,
                            removedGutterBackground: theme.palette.error.main,
                            gutterBackground: theme.palette.grey[800],
                            gutterBackgroundDark: theme.palette.grey[900],
                            highlightBackground: theme.palette.warning.dark,
                            highlightGutterBackground: theme.palette.warning.main,
                            codeFoldGutterBackground: theme.palette.grey[800],
                            codeFoldBackground: theme.palette.grey[900],
                            emptyLineBackground: theme.palette.grey[900],
                            gutterColor: theme.palette.grey[300],
                            addedGutterColor: theme.palette.common.white,
                            removedGutterColor: theme.palette.common.white,
                            codeFoldContentColor: theme.palette.grey[300],
                            diffViewerTitleBackground: theme.palette.grey[800],
                            diffViewerTitleColor: theme.palette.common.white,
                            diffViewerTitleBorderColor: theme.palette.grey[700],
                          },
                          light: {
                            diffViewerBackground: theme.palette.common.white,
                            diffViewerColor: theme.palette.common.black,
                            addedBackground: theme.palette.success.light,
                            addedColor: theme.palette.common.black,
                            removedBackground: theme.palette.error.light,
                            removedColor: theme.palette.common.black,
                            wordAddedBackground: theme.palette.success.light,
                            wordRemovedBackground: theme.palette.error.light,
                            addedGutterBackground: theme.palette.success.main,
                            removedGutterBackground: theme.palette.error.main,
                            gutterBackground: theme.palette.grey[100],
                            gutterBackgroundDark: theme.palette.grey[200],
                            highlightBackground: theme.palette.warning.light,
                            highlightGutterBackground: theme.palette.warning.main,
                            codeFoldGutterBackground: theme.palette.grey[100],
                            codeFoldBackground: theme.palette.grey[200],
                            emptyLineBackground: theme.palette.grey[50],
                            gutterColor: theme.palette.grey[700],
                            addedGutterColor: theme.palette.common.white,
                            removedGutterColor: theme.palette.common.white,
                            codeFoldContentColor: theme.palette.grey[700],
                            diffViewerTitleBackground: theme.palette.grey[100],
                            diffViewerTitleColor: theme.palette.common.black,
                            diffViewerTitleBorderColor: theme.palette.grey[300],
                          }
                        }
                      }}
                    />
                  ) : (
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="caption" color="text.secondary">Version {versionA?.version}</Typography>
                        <Paper variant="outlined" sx={{ p: 1, mt: 1, bgcolor: getDiffColor('removed') }}>
                          <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                            {JSON.stringify(diff.version1, null, 2)}
                          </pre>
                        </Paper>
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="caption" color="text.secondary">Version {versionB?.version}</Typography>
                        <Paper variant="outlined" sx={{ p: 1, mt: 1, bgcolor: getDiffColor('added') }}>
                          <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                            {JSON.stringify(diff.version2, null, 2)}
                          </pre>
                        </Paper>
                      </Box>
                    </Box>
                  )}
                </Paper>
              ))}
            </Box>
          </Box>
        )}

        {differences.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography color="text.secondary">
              No differences found between these versions.
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Full Content Diff */}
      <Paper sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Code sx={{ mr: 1 }} />
          <Typography variant="h6">Full Content Comparison</Typography>
        </Box>
        <ReactDiffViewer
          oldValue={oldContent}
          newValue={newContent}
          splitView={true}
          disableWordDiff={false}
          useDarkTheme={theme.palette.mode === 'dark'}
          styles={{
            variables: {
              dark: {
                diffViewerBackground: theme.palette.grey[900],
                diffViewerColor: theme.palette.common.white,
                addedBackground: theme.palette.success.dark,
                addedColor: theme.palette.common.white,
                removedBackground: theme.palette.error.dark,
                removedColor: theme.palette.common.white,
                wordAddedBackground: theme.palette.success.light,
                wordRemovedBackground: theme.palette.error.light,
                addedGutterBackground: theme.palette.success.main,
                removedGutterBackground: theme.palette.error.main,
                gutterBackground: theme.palette.grey[800],
                gutterBackgroundDark: theme.palette.grey[900],
                highlightBackground: theme.palette.warning.dark,
                highlightGutterBackground: theme.palette.warning.main,
                codeFoldGutterBackground: theme.palette.grey[800],
                codeFoldBackground: theme.palette.grey[900],
                emptyLineBackground: theme.palette.grey[900],
                gutterColor: theme.palette.grey[300],
                addedGutterColor: theme.palette.common.white,
                removedGutterColor: theme.palette.common.white,
                codeFoldContentColor: theme.palette.grey[300],
                diffViewerTitleBackground: theme.palette.grey[800],
                diffViewerTitleColor: theme.palette.common.white,
                diffViewerTitleBorderColor: theme.palette.grey[700],
              },
              light: {
                diffViewerBackground: theme.palette.common.white,
                diffViewerColor: theme.palette.common.black,
                addedBackground: theme.palette.success.light,
                addedColor: theme.palette.common.black,
                removedBackground: theme.palette.error.light,
                removedColor: theme.palette.common.black,
                wordAddedBackground: theme.palette.success.light,
                wordRemovedBackground: theme.palette.error.light,
                addedGutterBackground: theme.palette.success.main,
                removedGutterBackground: theme.palette.error.main,
                gutterBackground: theme.palette.grey[100],
                gutterBackgroundDark: theme.palette.grey[200],
                highlightBackground: theme.palette.warning.light,
                highlightGutterBackground: theme.palette.warning.main,
                codeFoldGutterBackground: theme.palette.grey[100],
                codeFoldBackground: theme.palette.grey[200],
                emptyLineBackground: theme.palette.grey[50],
                gutterColor: theme.palette.grey[700],
                addedGutterColor: theme.palette.common.white,
                removedGutterColor: theme.palette.common.white,
                codeFoldContentColor: theme.palette.grey[700],
                diffViewerTitleBackground: theme.palette.grey[100],
                diffViewerTitleColor: theme.palette.common.black,
                diffViewerTitleBorderColor: theme.palette.grey[300],
              }
            }
          }}
        />
      </Paper>
    </Box>
  );
};

export default VersionComparison;