import React, { useState, useCallback, useMemo } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  Button,
  Tabs,
  Tab,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  useTheme,
  alpha,
  Paper,
} from '@mui/material';
import {
  Save as SaveIcon,
  PlayArrow as RunIcon,
  Code as CodeIcon,
  ViewList as ViewListIcon,
  AccountTree as TreeIcon,
  Close as CloseIcon,
  Psychology,
  Transform,
  FilterAlt,
  Api,
  Assessment,
} from '@mui/icons-material';
import ReactFlow, {
  Node,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  BackgroundVariant,
  Panel,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { Pipeline } from '../../types';
import { usePipelineOperations } from '../../hooks/usePipelines';
// import PipelineCanvas from './PipelineCanvas';
import StepConfigPanel from './StepConfigPanel';
import PipelineExecutor from './PipelineExecutor';

interface PipelineBuilderProps {
  pipelineId?: string;
  onBack?: () => void;
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
    id={`pipeline-builder-tabpanel-${index}`}
    aria-labelledby={`pipeline-builder-tab-${index}`}
    {...other}
  >
    {value === index && <Box sx={{ height: '100%' }}>{children}</Box>}
  </div>
);

// Node types for different pipeline steps
const nodeTypes = [
  {
    type: 'prompt',
    label: 'Prompt Step',
    icon: <Psychology />,
    color: '#2196F3',
    description: 'Execute a prompt with LLM',
  },
  {
    type: 'transform',
    label: 'Transform',
    icon: <Transform />,
    color: '#FF9800',
    description: 'Transform or format data',
  },
  {
    type: 'filter',
    label: 'Filter',
    icon: <FilterAlt />,
    color: '#4CAF50',
    description: 'Filter or validate data',
  },
  {
    type: 'api',
    label: 'API Call',
    icon: <Api />,
    color: '#9C27B0',
    description: 'Make external API call',
  },
  {
    type: 'analysis',
    label: 'Analysis',
    icon: <Assessment />,
    color: '#F44336',
    description: 'Analyze or score output',
  },
];

const PipelineBuilder: React.FC<PipelineBuilderProps> = ({
  pipelineId,
  onBack,
}) => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  // const [pipeline, setPipeline] = useState<Pipeline | null>(null);

  // ReactFlow state
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Pipeline operations
  const pipelineOperations = usePipelineOperations();

  // Initial nodes for empty pipeline
  const initialNodes = useMemo(() => [
    {
      id: 'start',
      type: 'input',
      position: { x: 250, y: 25 },
      data: { label: 'Start' },
      style: {
        background: theme.palette.success.main,
        color: 'white',
        border: 'none',
        borderRadius: '8px',
      },
    },
    {
      id: 'end',
      type: 'output',
      position: { x: 250, y: 400 },
      data: { label: 'End' },
      style: {
        background: theme.palette.error.main,
        color: 'white',
        border: 'none',
        borderRadius: '8px',
      },
    },
  ], [theme]);

  // Initialize nodes if empty
  React.useEffect(() => {
    if (nodes.length === 0) {
      setNodes(initialNodes);
    }
  }, [nodes.length, initialNodes, setNodes]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
    setSidebarOpen(true);
  }, []);

  const addNodeToCanvas = useCallback((nodeType: any) => {
    const newNode: Node = {
      id: `${nodeType.type}_${Date.now()}`,
      type: 'default',
      position: { x: Math.random() * 400 + 100, y: Math.random() * 300 + 100 },
      data: {
        label: nodeType.label,
        type: nodeType.type,
        config: {},
      },
      style: {
        background: alpha(nodeType.color, 0.1),
        border: `2px solid ${nodeType.color}`,
        borderRadius: '8px',
        padding: '10px',
        minWidth: '150px',
      },
    };

    setNodes((nds) => [...nds, newNode]);
  }, [setNodes]);

  const handleSavePipeline = useCallback(async () => {
    const pipelineData: Pipeline = {
      id: pipelineId || `pipeline_${Date.now()}`,
      name: 'New Pipeline',
      description: '',
      steps: nodes
        .filter(node => node.type === 'default')
        .map(node => ({
          id: node.id,
          type: node.data.type,
          name: node.data.label,
          configuration: node.data.config || {},
          position: node.position,
        })),
      error_strategy: 'fail_fast',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      version: '1.0.0',
      tags: [],
    };

    try {
      // Temporarily disabled - pipeline endpoints not available in current backend
      console.log('Pipeline save temporarily disabled - backend endpoints not available');
      alert('Pipeline functionality is temporarily disabled. Backend needs to be restarted to enable pipeline operations.');
      return;

      // Uncomment when backend is restarted:
      // if (pipelineId) {
      //   await pipelineOperations.update({ id: pipelineId, data: pipelineData });
      // } else {
      //   await pipelineOperations.create(pipelineData);
      // }
    } catch (error) {
      console.error('Failed to save pipeline:', error);
    }
  }, [pipelineId, nodes, pipelineOperations]);

  const handleRunPipeline = useCallback(() => {
    setActiveTab(2); // Switch to executor tab
  }, []);

  return (
    <Container maxWidth="xl" sx={{ height: '100vh', py: 2 }}>
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography
            variant="h4"
            component="h1"
            sx={{
              fontWeight: 700,
              background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            <TreeIcon sx={{ mr: 2, verticalAlign: 'middle' }} />
            Pipeline Builder
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<SaveIcon />}
              onClick={handleSavePipeline}
              disabled
            >
              Save (Disabled)
            </Button>
            
            <Button
              variant="contained"
              startIcon={<RunIcon />}
              onClick={handleRunPipeline}
            >
              Run Pipeline
            </Button>
          </Box>
        </Box>

        {/* Main Content */}
        <Card sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Tabs */}
          <Tabs
            value={activeTab}
            onChange={(_, newValue) => setActiveTab(newValue)}
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab icon={<TreeIcon />} label="Visual Editor" />
            <Tab icon={<CodeIcon />} label="Code View" />
            <Tab icon={<RunIcon />} label="Execute" />
          </Tabs>

          {/* Tab Content */}
          <Box sx={{ flex: 1, position: 'relative' }}>
            <TabPanel value={activeTab} index={0}>
              <Box sx={{ height: '100%', display: 'flex' }}>
                {/* Node Palette Sidebar */}
                <Drawer
                  variant="persistent"
                  anchor="left"
                  open={sidebarOpen}
                  sx={{
                    width: 280,
                    flexShrink: 0,
                    '& .MuiDrawer-paper': {
                      width: 280,
                      position: 'relative',
                      border: 'none',
                      borderRight: `1px solid ${theme.palette.divider}`,
                    },
                  }}
                >
                  <Box sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6">
                        Components
                      </Typography>
                      <IconButton onClick={() => setSidebarOpen(false)}>
                        <CloseIcon />
                      </IconButton>
                    </Box>
                    
                    <List>
                      {nodeTypes.map((nodeType) => (
                        <ListItem
                          key={nodeType.type}
                          sx={{
                            mb: 1,
                            border: `1px solid ${alpha(nodeType.color, 0.3)}`,
                            borderRadius: 2,
                            cursor: 'pointer',
                            '&:hover': {
                              backgroundColor: alpha(nodeType.color, 0.1),
                            },
                          }}
                          onClick={() => addNodeToCanvas(nodeType)}
                        >
                          <ListItemIcon sx={{ color: nodeType.color }}>
                            {nodeType.icon}
                          </ListItemIcon>
                          <ListItemText
                            primary={nodeType.label}
                            secondary={nodeType.description}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                </Drawer>

                {/* Canvas Area */}
                <Box sx={{ flex: 1, height: '100%' }}>
                  <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    onNodeClick={onNodeClick}
                    fitView
                    style={{ backgroundColor: theme.palette.grey[50] }}
                  >
                    <Controls />
                    <Background variant={BackgroundVariant.Dots} />
                    
                    <Panel position="top-right">
                      {!sidebarOpen && (
                        <Button
                          variant="outlined"
                          startIcon={<ViewListIcon />}
                          onClick={() => setSidebarOpen(true)}
                        >
                          Components
                        </Button>
                      )}
                    </Panel>
                  </ReactFlow>
                </Box>

                {/* Configuration Panel */}
                {selectedNode && (
                  <StepConfigPanel
                    node={selectedNode}
                    onNodeUpdate={(updatedNode) => {
                      setNodes((nds) =>
                        nds.map((node) =>
                          node.id === updatedNode.id ? updatedNode : node
                        )
                      );
                    }}
                    onClose={() => setSelectedNode(null)}
                  />
                )}
              </Box>
            </TabPanel>

            <TabPanel value={activeTab} index={1}>
              <Box sx={{ p: 3, height: '100%' }}>
                <Typography variant="h6" gutterBottom>
                  Pipeline Configuration (JSON)
                </Typography>
                <Paper sx={{ p: 2, height: 'calc(100% - 60px)', backgroundColor: theme.palette.grey[50] }}>
                  <Typography
                    component="pre"
                    sx={{
                      fontFamily: 'monospace',
                      fontSize: '0.875rem',
                      overflow: 'auto',
                      height: '100%',
                    }}
                  >
                    {JSON.stringify({
                      nodes: nodes.filter(node => node.type === 'default'),
                      edges,
                      pipeline_config: {
                        error_strategy: 'fail_fast',
                        parallel_execution: false,
                        timeout: 300,
                      },
                    }, null, 2)}
                  </Typography>
                </Paper>
              </Box>
            </TabPanel>

            <TabPanel value={activeTab} index={2}>
              <PipelineExecutor
                nodes={nodes}
                edges={edges}
                onExecutionComplete={(results) => {
                  console.log('Pipeline execution results:', results);
                }}
              />
            </TabPanel>
          </Box>
        </Card>
      </Box>
    </Container>
  );
};

export default PipelineBuilder;
