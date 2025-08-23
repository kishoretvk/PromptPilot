import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

interface DiffViewerProps {
  oldContent: string;
  newContent: string;
  oldTitle?: string;
  newTitle?: string;
}

export const DiffViewer: React.FC<DiffViewerProps> = ({ 
  oldContent, 
  newContent, 
  oldTitle = 'Before', 
  newTitle = 'After' 
}) => {
  // Simple diff algorithm to highlight changes
  const computeDiff = (oldText: string, newText: string) => {
    const oldLines = oldText.split('\n');
    const newLines = newText.split('\n');
    const maxLines = Math.max(oldLines.length, newLines.length);
    
    const diffLines = [];
    
    for (let i = 0; i < maxLines; i++) {
      const oldLine = oldLines[i] || '';
      const newLine = newLines[i] || '';
      
      if (oldLine === newLine) {
        diffLines.push({ type: 'unchanged', content: newLine, lineNumber: i + 1 });
      } else if (oldLine === undefined) {
        diffLines.push({ type: 'added', content: newLine, lineNumber: i + 1 });
      } else if (newLine === undefined) {
        diffLines.push({ type: 'removed', content: oldLine, lineNumber: i + 1 });
      } else {
        // For simplicity, we'll mark the entire line as changed if different
        diffLines.push({ type: 'removed', content: oldLine, lineNumber: i + 1 });
        diffLines.push({ type: 'added', content: newLine, lineNumber: i + 1 });
      }
    }
    
    return diffLines;
  };
  
  const diffLines = computeDiff(oldContent, newContent);
  
  return (
    <Box sx={{ display: 'flex', gap: 2, height: '70vh' }}>
      {/* Before */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Typography variant="subtitle1" sx={{ p: 1, bgcolor: 'grey.100', textAlign: 'center' }}>
          {oldTitle}
        </Typography>
        <Paper 
          elevation={0} 
          sx={{ 
            flex: 1, 
            p: 2, 
            fontFamily: 'monospace',
            overflow: 'auto',
            bgcolor: 'grey.50'
          }}
        >
          {oldContent.split('\n').map((line, index) => (
            <Box 
              key={index} 
              sx={{ 
                py: 0.5,
                '&:hover': { bgcolor: 'grey.100' }
              }}
            >
              <Typography 
                variant="body2" 
                sx={{ 
                  whiteSpace: 'pre-wrap',
                  color: 'text.primary'
                }}
              >
                {line || ' '}
              </Typography>
            </Box>
          ))}
        </Paper>
      </Box>
      
      {/* After */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Typography variant="subtitle1" sx={{ p: 1, bgcolor: 'grey.100', textAlign: 'center' }}>
          {newTitle}
        </Typography>
        <Paper 
          elevation={0} 
          sx={{ 
            flex: 1, 
            p: 2, 
            fontFamily: 'monospace',
            overflow: 'auto',
            bgcolor: 'grey.50'
          }}
        >
          {newContent.split('\n').map((line, index) => (
            <Box 
              key={index} 
              sx={{ 
                py: 0.5,
                '&:hover': { bgcolor: 'grey.100' }
              }}
            >
              <Typography 
                variant="body2" 
                sx={{ 
                  whiteSpace: 'pre-wrap',
                  color: 'text.primary'
                }}
              >
                {line || ' '}
              </Typography>
            </Box>
          ))}
        </Paper>
      </Box>
      
      {/* Combined Diff View */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Typography variant="subtitle1" sx={{ p: 1, bgcolor: 'grey.100', textAlign: 'center' }}>
          Changes
        </Typography>
        <Paper 
          elevation={0} 
          sx={{ 
            flex: 1, 
            p: 2, 
            fontFamily: 'monospace',
            overflow: 'auto'
          }}
        >
          {diffLines.map((line, index) => (
            <Box 
              key={index} 
              sx={{ 
                py: 0.5,
                bgcolor: line.type === 'added' ? 'success.light' : 
                         line.type === 'removed' ? 'error.light' : 'transparent',
                '&:hover': { 
                  bgcolor: line.type === 'added' ? 'success.main' : 
                           line.type === 'removed' ? 'error.main' : 'grey.100'
                }
              }}
            >
              <Typography 
                variant="body2" 
                sx={{ 
                  whiteSpace: 'pre-wrap',
                  color: line.type === 'added' ? 'success.dark' : 
                         line.type === 'removed' ? 'error.dark' : 'text.primary'
                }}
              >
                {line.type === 'added' ? '+ ' : line.type === 'removed' ? '- ' : '  '}
                {line.content || ' '}
              </Typography>
            </Box>
          ))}
        </Paper>
      </Box>
    </Box>
  );
};