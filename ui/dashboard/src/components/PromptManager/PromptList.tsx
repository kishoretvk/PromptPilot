import React, { useState, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
  TextField,
  InputAdornment,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Avatar,
  LinearProgress,
} from '@mui/material';
import {
  Search,
  MoreVert,
  Edit,
  PlayArrow,
  ContentCopy,
  Delete,
  Visibility,
  Schedule,
  Person,
  Tag,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { Prompt } from '../../types';
import { usePrompts } from '../../hooks/usePrompts';

interface PromptListProps {
  onPromptSelect: (prompt: Prompt) => void;
  onEditPrompt: (prompt: Prompt) => void;
  onTestPrompt: (prompt: Prompt) => void;
  onDuplicate?: (prompt: Prompt) => void;
  onDelete?: (prompt: Prompt) => void;
  selectedPromptId?: string;
}

interface PromptMenuState {
  anchorEl: HTMLElement | null;
  prompt: Prompt | null;
}

const PromptList: React.FC<PromptListProps> = ({
  onPromptSelect,
  onEditPrompt,
  onTestPrompt,
  onDuplicate,
  onDelete,
  selectedPromptId,
}) => {
  const theme = useTheme();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [menuState, setMenuState] = useState<PromptMenuState>({
    anchorEl: null,
    prompt: null,
  });

  const { data: prompts, isLoading, error } = usePrompts(page + 1, rowsPerPage, searchTerm);

  const filteredPrompts = useMemo(() => {
    if (!prompts?.items) return [];
    
    if (!searchTerm.trim()) return prompts.items;
    
    const term = searchTerm.toLowerCase();
    return prompts.items.filter((prompt: Prompt) =>
      prompt.name.toLowerCase().includes(term) ||
      prompt.description.toLowerCase().includes(term) ||
      prompt.task_type.toLowerCase().includes(term) ||
      prompt.tags.some((tag: string) => tag.toLowerCase().includes(term))
    );
  }, [prompts?.items, searchTerm]);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, prompt: Prompt) => {
    event.stopPropagation();
    setMenuState({
      anchorEl: event.currentTarget,
      prompt,
    });
  };

  const handleMenuClose = () => {
    setMenuState({
      anchorEl: null,
      prompt: null,
    });
  };

  const handleMenuAction = (action: string) => {
    if (!menuState.prompt) return;
    
    switch (action) {
      case 'edit':
        onEditPrompt(menuState.prompt);
        break;
      case 'test':
        onTestPrompt(menuState.prompt);
        break;
      case 'duplicate':
        onDuplicate?.(menuState.prompt);
        break;
      case 'delete':
        onDelete?.(menuState.prompt);
        break;
    }
    
    handleMenuClose();
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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

  if (error) {
    return (
      <Card>
        <CardContent>
          <Typography color="error">
            Error loading prompts: {error.message}
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Search Bar */}
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search prompts by name, description, type, or tags..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              backgroundColor: theme.palette.background.paper,
            },
          }}
        />
      </Box>

      {/* Loading Progress */}
      {isLoading && (
        <Box sx={{ mb: 2 }}>
          <LinearProgress />
        </Box>
      )}

      {/* Prompts Table */}
      <Card sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <TableContainer component={Paper} sx={{ flex: 1 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Active</TableCell>
                <TableCell>Tags</TableCell>
                <TableCell>Author</TableCell>
                <TableCell>Updated</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredPrompts.map((prompt: Prompt) => (
                <TableRow
                  key={prompt.id}
                  hover
                  selected={selectedPromptId === prompt.id}
                  onClick={() => onPromptSelect(prompt)}
                  sx={{
                    cursor: 'pointer',
                    '&.Mui-selected': {
                      backgroundColor: theme.palette.action.selected,
                    },
                  }}
                >
                  <TableCell>
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        {prompt.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" noWrap>
                        {prompt.description}
                      </Typography>
                    </Box>
                  </TableCell>
                  
                  <TableCell>
                    <Chip
                      label={prompt.task_type}
                      size="small"
                      variant="outlined"
                      sx={{
                        textTransform: 'capitalize',
                      }}
                    />
                  </TableCell>
                  
                  <TableCell>
                    <Chip
                      label={prompt.version_info?.is_active ? 'Active' : 'Inactive'}
                      size="small"
                      sx={{
                        backgroundColor: (prompt.version_info?.is_active ?? false) ? theme.palette.success.main : theme.palette.grey[500],
                        color: theme.palette.common.white,
                        textTransform: 'capitalize',
                      }}
                    />
                  </TableCell>
                  
                  <TableCell>
                    {prompt.version_info?.is_active ? (
                      <Chip
                        label="Active"
                        size="small"
                        color="success"
                      />
                    ) : (
                      <Chip
                        label="Inactive"
                        size="small"
                        color="default"
                      />
                    )}
                  </TableCell>
                  
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', maxWidth: 200 }}>
                      {prompt.tags.slice(0, 2).map((tag: string, index: number) => (
                        <Chip
                          key={index}
                          label={tag}
                          size="small"
                          variant="outlined"
                          icon={<Tag fontSize="small" />}
                          sx={{ fontSize: '0.75rem' }}
                        />
                      ))}
                      {prompt.tags.length > 2 && (
                        <Tooltip
                          title={prompt.tags.slice(2).join(', ')}
                          arrow
                        >
                          <Chip
                            label={`+${prompt.tags.length - 2}`}
                            size="small"
                            variant="outlined"
                            sx={{ fontSize: '0.75rem' }}
                          />
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>
                  
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem' }}>
                        <Person fontSize="small" />
                      </Avatar>
                      <Typography variant="body2">
                        {prompt.version_info?.created_by || 'Unknown'}
                      </Typography>
                    </Box>
                  </TableCell>
                  
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Schedule fontSize="small" color="disabled" />
                      <Typography variant="body2" color="text.secondary">
                        {formatDate(prompt.version_info?.created_at || prompt.created_at || new Date().toISOString())}
                      </Typography>
                    </Box>
                  </TableCell>
                  
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            onPromptSelect(prompt);
                          }}
                        >
                          <Visibility fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      
                      <Tooltip title="Test Prompt">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            onTestPrompt(prompt);
                          }}
                        >
                          <PlayArrow fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuOpen(e, prompt)}
                      >
                        <MoreVert fontSize="small" />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        <TablePagination
          component="div"
          count={prompts?.total || 0}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 25, 50]}
          showFirstButton
          showLastButton
        />
      </Card>

      {/* Context Menu */}
      <Menu
        anchorEl={menuState.anchorEl}
        open={Boolean(menuState.anchorEl)}
        onClose={handleMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={() => handleMenuAction('edit')}>
          <ListItemIcon>
            <Edit fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>
        
        <MenuItem onClick={() => handleMenuAction('test')}>
          <ListItemIcon>
            <PlayArrow fontSize="small" />
          </ListItemIcon>
          <ListItemText>Test</ListItemText>
        </MenuItem>
        
        <MenuItem onClick={() => handleMenuAction('duplicate')}>
          <ListItemIcon>
            <ContentCopy fontSize="small" />
          </ListItemIcon>
          <ListItemText>Duplicate</ListItemText>
        </MenuItem>
        
        <MenuItem 
          onClick={() => handleMenuAction('delete')}
          sx={{ color: theme.palette.error.main }}
        >
          <ListItemIcon>
            <Delete fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default PromptList;
