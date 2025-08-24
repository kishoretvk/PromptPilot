import React, { useState, useCallback } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Tabs,
  Tab,
  Paper,
  Fab,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Add as AddIcon,
  List as ListIcon,
  Edit as EditIcon,
  PlayArrow as TestIcon,
} from '@mui/icons-material';
import { Prompt } from '../../types';
import PromptList from './PromptList';
import PromptEditor from './PromptEditor';
import PromptTester from './PromptTester';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`prompt-manager-tabpanel-${index}`}
      aria-labelledby={`prompt-manager-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `prompt-manager-tab-${index}`,
    'aria-controls': `prompt-manager-tabpanel-${index}`,
  };
}

export type PromptManagerView = 'list' | 'editor' | 'tester';

interface PromptManagerProps {
  onPromptSelect?: (promptId: string) => void;
  initialView?: PromptManagerView;
}

const PromptManager: React.FC<PromptManagerProps> = ({
  onPromptSelect,
  initialView = 'list',
}) => {
  const theme = useTheme();
  const [currentView, setCurrentView] = useState<PromptManagerView>(initialView);
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  
  // Get tab index from view
  const getTabIndex = (view: PromptManagerView): number => {
    switch (view) {
      case 'list': return 0;
      case 'editor': return 1;
      case 'tester': return 2;
      default: return 0;
    }
  };
  
  // Get view from tab index
  const getViewFromTab = (index: number): PromptManagerView => {
    switch (index) {
      case 0: return 'list';
      case 1: return 'editor';
      case 2: return 'tester';
      default: return 'list';
    }
  };
  
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    const newView = getViewFromTab(newValue);
    setCurrentView(newView);
    
    // Reset creating state when switching tabs
    if (newView !== 'editor') {
      setIsCreating(false);
    }
  };
  
  const handlePromptSelect = useCallback((prompt: Prompt) => {
    setSelectedPrompt(prompt);
    if (onPromptSelect) {
      onPromptSelect(prompt.id);
    }
  }, [onPromptSelect]);
  
  const handleEditPrompt = useCallback((prompt: Prompt) => {
    setSelectedPrompt(prompt);
    setIsCreating(false);
    setCurrentView('editor');
  }, []);
  
  const handleTestPrompt = useCallback((prompt: Prompt) => {
    setSelectedPrompt(prompt);
    setCurrentView('tester');
  }, []);
  
  const handleCreateNew = useCallback(() => {
    setSelectedPrompt(null);
    setIsCreating(true);
    setCurrentView('editor');
  }, []);
  
  const handlePromptCreated = useCallback((newPrompt: Prompt) => {
    setSelectedPrompt(newPrompt);
    setIsCreating(false);
    setCurrentView('list');
  }, []);
  
  const handlePromptUpdated = useCallback((updatedPrompt: Prompt) => {
    setSelectedPrompt(updatedPrompt);
    setCurrentView('list');
  }, []);
  
  const handleCancelEdit = useCallback(() => {
    setIsCreating(false);
    setSelectedPrompt(null);
    setCurrentView('list');
  }, []);

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 3 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
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
            Prompt Management
          </Typography>
          <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 2 }}>
            Create, edit, test, and manage your LLM prompts
          </Typography>
          
          {/* Action Buttons */}
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreateNew}
              sx={{
                borderRadius: 2,
                px: 3,
                py: 1.5,
                boxShadow: theme.shadows[2],
                '&:hover': {
                  boxShadow: theme.shadows[4],
                },
              }}
            >
              Create New Prompt
            </Button>
          </Box>
        </Box>

        {/* Navigation Tabs */}
        <Paper
          elevation={0}
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            bgcolor: 'background.paper',
            borderRadius: 2,
            mb: 3,
            overflow: 'hidden',
          }}
        >
          <Tabs
            value={getTabIndex(currentView)}
            onChange={handleTabChange}
            aria-label="prompt manager tabs"
            variant="fullWidth"
            sx={{
              '& .MuiTab-root': {
                minHeight: 64,
                textTransform: 'none',
                fontSize: '1rem',
                fontWeight: 500,
                '&.Mui-selected': {
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                },
              },
              '& .MuiTabs-indicator': {
                height: 3,
                borderRadius: '3px 3px 0 0',
              },
            }}
          >
            <Tab
              icon={<ListIcon />}
              label="Prompt Library"
              iconPosition="start"
              {...a11yProps(0)}
            />
            <Tab
              icon={<EditIcon />}
              label={isCreating ? "Create Prompt" : "Edit Prompt"}
              iconPosition="start"
              {...a11yProps(1)}
              disabled={!isCreating && !selectedPrompt}
            />
            <Tab
              icon={<TestIcon />}
              label="Test Prompt"
              iconPosition="start"
              {...a11yProps(2)}
              disabled={!selectedPrompt}
            />
          </Tabs>
        </Paper>

        {/* Tab Content */}
        <Box sx={{ minHeight: '60vh' }}>
          <TabPanel value={getTabIndex(currentView)} index={0}>
            <PromptList
              onPromptSelect={handlePromptSelect}
              onEditPrompt={handleEditPrompt}
              onTestPrompt={handleTestPrompt}
              selectedPromptId={selectedPrompt?.id}
            />
          </TabPanel>
          
          <TabPanel value={getTabIndex(currentView)} index={1}>
            <PromptEditor
              prompt={selectedPrompt}
              isCreating={isCreating}
              onPromptCreated={handlePromptCreated}
              onPromptUpdated={handlePromptUpdated}
              onCancel={handleCancelEdit}
            />
          </TabPanel>
          
          <TabPanel value={getTabIndex(currentView)} index={2}>
            {selectedPrompt && (
              <PromptTester
                prompt={selectedPrompt}
                onEditPrompt={() => handleEditPrompt(selectedPrompt)}
              />
            )}
          </TabPanel>
        </Box>
      </Box>

      {/* Floating Action Button */}
      {currentView === 'list' && (
        <Fab
          color="primary"
          aria-label="create new prompt"
          onClick={handleCreateNew}
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: theme.zIndex.fab,
            boxShadow: theme.shadows[6],
            '&:hover': {
              boxShadow: theme.shadows[8],
            },
          }}
        >
          <AddIcon />
        </Fab>
      )}
    </Container>
  );
};

export default PromptManager;