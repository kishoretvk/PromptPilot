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

interface VersionComparisonProps {
  versionA: any;
  versionB: any;
  differences: any[];
  onBack: () => void;
}

const VersionComparison: React.FC<VersionComparisonProps> = ({
  versionA,
  versionB,
  differences,
  onBack,
}) => {
  const theme = useTheme();
  const [filter, setFilter] = useState<string>('all');
  const [expandedFields, setExpandedFields] = useState<Record<string, boolean>>({});

  const formatContentForDiff = (content: any) => {
    return JSON.stringify(content, null, 2);
  };

  const oldContent = formatContentForDiff(versionA?.content || {});
  const newContent = formatContentForDiff(versionB?.content || {});

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

  const fieldStatistics = differences?.summary?.field_statistics || {
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
                  {versionA?.content?.created_by || 'Unknown'}
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
                  {versionB?.content?.created_by || 'Unknown'}
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
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {filteredDifferences.map((diff, index) => (
                <Tooltip key={index} title={`${diff.type}: ${diff.field}`}>
                  <Chip 
                    label={diff.field} 
                    size="small" 
                    color={
                      diff.type === 'modified' ? 'warning' : 
                      diff.type === 'added' ? 'success' : 'error'
                    }
                    variant="outlined"
                    onClick={() => toggleFieldExpansion(diff.field)}
                    icon={getDiffIcon(diff.type)}
                  />
                </Tooltip>
              ))}
            </Box>
          </Box>
        )}
      </Paper>

      {/* Field-Level Differences */}
      {filteredDifferences.length > 0 && (
        <Paper sx={{ mb: 4, p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Field-Level Differences
          </Typography>
          <Divider sx={{ mb: 2 }} />
          
          {filteredDifferences.map((diff, index) => (
            <Accordion 
              key={index} 
              expanded={expandedFields[diff.field] || false}
              onChange={() => toggleFieldExpansion(diff.field)}
              sx={{ mb: 1 }}
            >
              <AccordionSummary 
                expandIcon={<ExpandMore />}
                sx={{ 
                  bgcolor: getDiffColor(diff.type),
                  '&:hover': { bgcolor: theme.palette.action.hover }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {getDiffIcon(diff.type)}
                  <Typography>{diff.field}</Typography>
                  <Chip 
                    label={diff.type} 
                    size="small" 
                    color={
                      diff.type === 'modified' ? 'warning' : 
                      diff.type === 'added' ? 'success' : 'error'
                    }
                    variant="outlined"
                  />
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                {diff.field === 'messages' && diff.diff ? (
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Message Changes:
                    </Typography>
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Index</TableCell>
                            <TableCell>Type</TableCell>
                            <TableCell>Details</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {diff.diff.map((msgDiff: any, msgIndex: number) => (
                            <TableRow key={msgIndex}>
                              <TableCell>{msgDiff.index}</TableCell>
                              <TableCell>
                                <Chip 
                                  label={msgDiff.type} 
                                  size="small" 
                                  color={
                                    msgDiff.type === 'modified' ? 'warning' : 
                                    msgDiff.type === 'added' ? 'success' : 'error'
                                  }
                                  variant="outlined"
                                />
                              </TableCell>
                              <TableCell>
                                {msgDiff.content_diff ? (
                                  <Box sx={{ mt: 1 }}>
                                    <ReactDiffViewer
                                      oldValue={msgDiff.version1?.content || ''}
                                      newValue={msgDiff.version2?.content || ''}
                                      splitView={true}
                                      useDarkTheme={theme.palette.mode === 'dark'}
                                      styles={{
                                        diffContainer: {
                                          pre: {
                                            lineHeight: '1.4',
                                            fontSize: '0.8rem',
                                          },
                                        },
                                      }}
                                    />
                                  </Box>
                                ) : (
                                  <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.8rem' }}>
                                    {JSON.stringify({ version1: msgDiff.version1, version2: msgDiff.version2 }, null, 2)}
                                  </pre>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                ) : diff.field === 'parameters' && diff.diff ? (
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Parameter Changes:
                    </Typography>
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Key</TableCell>
                            <TableCell>Type</TableCell>
                            <TableCell>Version 1</TableCell>
                            <TableCell>Version 2</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {diff.diff.map((paramDiff: any, paramIndex: number) => (
                            <TableRow key={paramIndex}>
                              <TableCell>{paramDiff.key}</TableCell>
                              <TableCell>
                                <Chip 
                                  label={paramDiff.type} 
                                  size="small" 
                                  color={
                                    paramDiff.type === 'modified' ? 'warning' : 
                                    paramDiff.type === 'added' ? 'success' : 'error'
                                  }
                                  variant="outlined"
                                />
                              </TableCell>
                              <TableCell>
                                <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.8rem' }}>
                                  {JSON.stringify(paramDiff.version1, null, 2)}
                                </pre>
                              </TableCell>
                              <TableCell>
                                <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.8rem' }}>
                                  {JSON.stringify(paramDiff.version2, null, 2)}
                                </pre>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                ) : diff.field === 'input_variables' && diff.diff ? (
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Input Variable Changes:
                    </Typography>
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Key</TableCell>
                            <TableCell>Type</TableCell>
                            <TableCell>Version 1</TableCell>
                            <TableCell>Version 2</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {diff.diff.map((varDiff: any, varIndex: number) => (
                            <TableRow key={varIndex}>
                              <TableCell>{varDiff.key}</TableCell>
                              <TableCell>
                                <Chip 
                                  label={varDiff.type} 
                                  size="small" 
                                  color={
                                    varDiff.type === 'modified' ? 'warning' : 
                                    varDiff.type === 'added' ? 'success' : 'error'
                                  }
                                  variant="outlined"
                                />
                              </TableCell>
                              <TableCell>
                                <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.8rem' }}>
                                  {JSON.stringify(varDiff.version1, null, 2)}
                                </pre>
                              </TableCell>
                              <TableCell>
                                <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.8rem' }}>
                                  {JSON.stringify(varDiff.version2, null, 2)}
                                </pre>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                ) : diff.diff && Array.isArray(diff.diff) ? (
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Text Diff:
                    </Typography>
                    <ReactDiffViewer
                      oldValue={diff.diff.filter(line => line.startsWith('-') || line.startsWith(' ')).join('')}
                      newValue={diff.diff.filter(line => line.startsWith('+') || line.startsWith(' ')).join('')}
                      splitView={true}
                      useDarkTheme={theme.palette.mode === 'dark'}
                    />
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Version {versionA?.version}:
                      </Typography>
                      <pre style={{ whiteSpace: 'pre-wrap', backgroundColor: theme.palette.grey[100], padding: '8px', borderRadius: '4px' }}>
                        {JSON.stringify(diff.version1, null, 2)}
                      </pre>
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Version {versionB?.version}:
                      </Typography>
                      <pre style={{ whiteSpace: 'pre-wrap', backgroundColor: theme.palette.grey[100], padding: '8px', borderRadius: '4px' }}>
                        {JSON.stringify(diff.version2, null, 2)}
                      </pre>
                    </Box>
                  </Box>
                )}
              </AccordionDetails>
            </Accordion>
          ))}
        </Paper>
      )}

      {/* Detailed Diff Viewer */}
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Full Content Comparison
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <ReactDiffViewer
          oldValue={oldContent}
          newValue={newContent}
          splitView={true}
          useDarkTheme={theme.palette.mode === 'dark'}
          styles={{
            diffContainer: {
              pre: {
                lineHeight: '1.5',
              },
            },
            line: {
              '&:hover': {
                backgroundColor: theme.palette.action.hover,
              },
            },
          }}
        />
      </Paper>
    </Box>
  );
};

export default VersionComparison;