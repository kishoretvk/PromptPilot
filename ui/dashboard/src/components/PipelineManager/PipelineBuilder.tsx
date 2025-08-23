import React, { useState, useCallback, useEffect, useRef } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Button,
  IconButton,
  Tooltip,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  useTheme,
  useMediaQuery,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Avatar,
  Divider,
  Tabs,
  Tab
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  Settings as SettingsIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  CenterFocusStrong as CenterFocusIcon,
  Undo as UndoIcon,
  Redo as RedoIcon,
  Psychology as PsychologyIcon,
  Api as ApiIcon,
  DataObject as DataObjectIcon,
  Transform as TransformIcon,
  Output as OutputIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import ReactFlow, {
  Controls,
  ControlButton,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  MiniMap,
  Panel,
  MarkerType,
  Node,
  Edge,
  Connection,
  NodeTypes,
  EdgeTypes
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useParams, useNavigate } from 'react-router-dom';
import { usePipeline, useUpdatePipeline, useExecutePipeline } from '../../hooks/usePipelines';
import { Pipeline, PipelineNode, PipelineEdge } from '../../types/Pipeline';

// Custom node components
const PromptNode = ({ data }: { data: any }) => {
  return (
    <Card 
      variant="outlined" 
      sx={{ 
        width: 200, 
        minHeight: 100,
        bgcolor: 'primary.light',
        color: 'primary.contrastText',
        border: '2px solid',
        borderColor: 'primary.main'
      }}
    >
      <CardHeader
        avatar={
          <Avatar sx={{ bgcolor: 'primary.main' }}>
            <PsychologyIcon />
          </Avatar>
        }
        title={data.label || 'Prompt Node'}
        subheader="Prompt"
        sx={{ p: 1, '& .MuiCardHeader-content': { overflow: 'hidden' } }}
      />
      <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
        <Typography variant="body2" noWrap>
          {data.description || 'No description'}
        </Typography>
      </CardContent>
    </Card>
  );
};

const ApiNode = ({ data }: { data: any }) => {
  return (
    <Card 
      variant="outlined" 
      sx={{ 
        width: 200, 
        minHeight: 100,
        bgcolor: 'secondary.light',
        color: 'secondary.contrastText',
        border: '2px solid',
        borderColor: 'secondary.main'
      }}
    >
      <CardHeader
        avatar={
          <Avatar sx={{ bgcolor: 'secondary.main' }}>
            <ApiIcon />
          </Avatar>
        }
        title={data.label || 'API Node'}
        subheader="API Integration"
        sx={{ p: 1, '& .MuiCardHeader-content': { overflow: 'hidden' } }}
      />
      <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
        <Typography variant="body2" noWrap>
          {data.description || 'No description'}
        </Typography>
      </CardContent>
    </Card>
  );
};

const DataNode = ({ data }: { data: any }) => {
  return (
    <Card 
      variant="outlined" 
      sx={{ 
        width: 200, 
        minHeight: 100,
        bgcolor: 'info.light',
        color: 'info.contrastText',
        border: '2px solid',
        borderColor: 'info.main'
      }}
    >
      <CardHeader
        avatar={
          <Avatar sx={{ bgcolor: 'info.main' }}>
            <DataObjectIcon />
          </Avatar>
        }
        title={data.label || 'Data Node'}
        subheader="Data Processing"
        sx={{ p: 1, '& .MuiCardHeader-content': { overflow: 'hidden' } }}
      />
      <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
        <Typography variant="body2" noWrap>
          {data.description || 'No description'}
        </Typography>
      </CardContent>
    </Card>
  );
};

const TransformNode = ({ data }: { data: any }) => {
  return (
    <Card 
      variant="outlined" 
      sx={{ 
        width: 200, 
        minHeight: 100,
        bgcolor: 'warning.light',
        color: 'warning.contrastText',
        border: '2px solid',
        borderColor: 'warning.main'
      }}
    >
      <CardHeader
        avatar={
          <Avatar sx={{ bgcolor: 'warning.main' }}>
            <TransformIcon />
          </Avatar>
        }
        title={data.label || 'Transform Node'}
        subheader="Data Transformation"
        sx={{ p: 1, '& .MuiCardHeader-content': { overflow: 'hidden' } }}
      />
      <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
        <Typography variant="body2" noWrap>
          {data.description || 'No description'}
        </Typography>
      </CardContent>
    </Card>
  );
};

const OutputNode = ({ data }: { data: any }) => {
  return (
    <Card 
      variant="outlined" 
      sx={{ 
        width: 200, 
        minHeight: 100,
        bgcolor: 'success.light',
        color: 'success.contrastText',
        border: '2px solid',
        borderColor: 'success.main'
      }}
    >
      <CardHeader
        avatar={
          <Avatar sx={{ bgcolor: 'success.main' }}>
            <OutputIcon />
          </Avatar>
        }
        title={data.label || 'Output Node'}
        subheader="Output"
        sx={{ p: 1, '& .MuiCardHeader-content': { overflow: 'hidden' } }}
      />
      <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
        <Typography variant="body2" noWrap>
          {data.description || 'No description'}
        </Typography>
      </CardContent>
    </Card>
  );
};

const nodeTypes: NodeTypes = {
  prompt: PromptNode,
  api: ApiNode,
  data: DataNode,
  transform: TransformNode,
  output: OutputNode
};

const edgeTypes: EdgeTypes = {};

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
      id={`pipeline-tabpanel-${index}`}
      aria-labelledby={`pipeline-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const PipelineBuilder: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [openNodeDialog, setOpenNodeDialog] = useState(false);
  const [nodeData, setNodeData] = useState<any>({});
  const [activeTab, setActiveTab] = useState(0);
  
  const { data: pipeline, isLoading } = usePipeline(id || '');
  const updateMutation = useUpdatePipeline(id || '');
  const executeMutation = useExecutePipeline(id || '');
  
  // Initialize pipeline data
  useEffect(() => {
    if (pipeline && pipeline.nodes && pipeline.edges) {
      setNodes(pipeline.nodes.map(node => ({
        ...node,
        data: { ...node.data }
      })));
      setEdges(pipeline.edges.map(edge => ({
        ...edge,
        markerEnd: { type: MarkerType.ArrowClosed }
      })));
    }
  }, [pipeline, setNodes, setEdges]);
  
  const onConnect = useCallback(
    (params: Connection) => {
      setEdges(eds => addEdge(
        { ...params, markerEnd: { type: MarkerType.ArrowClosed } }, 
        eds
      ));
    },
    [setEdges]
  );
  
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);
  
  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      
      if (!reactFlowInstance || !reactFlowWrapper.current) return;
      
      const type = event.dataTransfer.getData('application/reactflow');
      
      // Check if the dropped element is valid
      if (typeof type === 'undefined' || !type) return;
      
      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      
      const newNode: Node = {
        id: `${type}-${Date.now()}`,
        type,
        position,
        data: { 
          label: `${type.charAt(0).toUpperCase() + type.slice(1)} Node`,
          description: `Description for ${type} node`
        },
      };
      
      setNodes(nds => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes]
  );
  
  const handleNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
    setNodeData(node.data);
    setOpenNodeDialog(true);
  }, []);
  
  const handleSaveNode = useCallback(() => {
    if (selectedNode) {
      setNodes(nds =>
        nds.map(node => {
          if (node.id === selectedNode.id) {
            return { ...node, data: { ...node.data, ...nodeData } };
          }
          return node;
        })
      );
      setOpenNodeDialog(false);
      setSelectedNode(null);
      setNodeData({});
    }
  }, [selectedNode, nodeData, setNodes]);
  
  const handleDeleteNode = useCallback((nodeId: string) => {
    setNodes(nds => nds.filter(node => node.id !== nodeId));
    setEdges(eds => eds.filter(edge => edge.source !== nodeId && edge.target !== nodeId));
  }, [setNodes, setEdges]);
  
  const handleSavePipeline = useCallback(() => {
    if (pipeline) {
      const updatedPipeline: Pipeline = {
        ...pipeline,
        nodes: nodes.map(node => ({
          ...node,
          data: { ...node.data }
        })),
        edges: edges.map(edge => ({
          ...edge,
          markerEnd: undefined // Remove markerEnd as it's not serializable
        }))
      };
      
      updateMutation.mutate(updatedPipeline);
    }
  }, [pipeline, nodes, edges, updateMutation]);
  
  const handleExecutePipeline = useCallback(() => {
    executeMutation.mutate({ inputs: {} });
  }, [executeMutation]);
  
  const handleTabChange = useCallback((event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  }, []);
  
  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };
  
  if (isLoading) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography>Loading pipeline...</Typography>
      </Box>
    );
  }
  
  return (
    <Box sx={{ py: 3, height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate(-1)}
            sx={{ mb: 1 }}
          >
            Back to Pipelines
          </Button>
          <Typography variant="h4" component="h1" gutterBottom>
            {pipeline?.name || 'Pipeline Builder'}
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            {pipeline?.description || 'Build and configure your AI pipeline workflow'}
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            startIcon={<UndoIcon />}
            disabled
          >
            Undo
          </Button>
          <Button
            variant="outlined"
            startIcon={<RedoIcon />}
            disabled
          >
            Redo
          </Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSavePipeline}
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? 'Saving...' : 'Save Pipeline'}
          </Button>
          <Button
            variant="contained"
            color="success"
            startIcon={<PlayIcon />}
            onClick={handleExecutePipeline}
            disabled={executeMutation.isPending}
          >
            {executeMutation.isPending ? 'Executing...' : 'Execute Pipeline'}
          </Button>
        </Box>
      </Box>
      
      <Grid container spacing={2} sx={{ flex: 1, minHeight: 0 }}>
        {/* Node Palette */}
        <Grid item xs={12} md={3}>
          <Paper elevation={0} sx={{ borderRadius: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
              <Typography variant="h6">Node Palette</Typography>
            </Box>
            
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              variant="fullWidth"
              sx={{ borderBottom: 1, borderColor: 'divider' }}
            >
              <Tab label="Nodes" />
              <Tab label="Settings" />
            </Tabs>
            
            <TabPanel value={activeTab} index={0}>
              <Box sx={{ p: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Drag and drop nodes onto the canvas
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Box
                      draggable
                      onDragStart={(event) => onDragStart(event, 'prompt')}
                      sx={{
                        p: 2,
                        border: '1px solid',
                        borderColor: 'primary.main',
                        borderRadius: 1,
                        bgcolor: 'primary.light',
                        color: 'primary.contrastText',
                        cursor: 'grab',
                        '&:hover': {
                          bgcolor: 'primary.main',
                        }
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PsychologyIcon />
                        <Typography>Prompt Node</Typography>
                      </Box>
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        AI prompt processing node
                      </Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Box
                      draggable
                      onDragStart={(event) => onDragStart(event, 'api')}
                      sx={{
                        p: 2,
                        border: '1px solid',
                        borderColor: 'secondary.main',
                        borderRadius: 1,
                        bgcolor: 'secondary.light',
                        color: 'secondary.contrastText',
                        cursor: 'grab',
                        '&:hover': {
                          bgcolor: 'secondary.main',
                        }
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ApiIcon />
                        <Typography>API Node</Typography>
                      </Box>
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        External API integration
                      </Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Box
                      draggable
                      onDragStart={(event) => onDragStart(event, 'data')}
                      sx={{
                        p: 2,
                        border: '1px solid',
                        borderColor: 'info.main',
                        borderRadius: 1,
                        bgcolor: 'info.light',
                        color: 'info.contrastText',
                        cursor: 'grab',
                        '&:hover': {
                          bgcolor: 'info.main',
                        }
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <DataObjectIcon />
                        <Typography>Data Node</Typography>
                      </Box>
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        Data processing and manipulation
                      </Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Box
                      draggable
                      onDragStart={(event) => onDragStart(event, 'transform')}
                      sx={{
                        p: 2,
                        border: '1px solid',
                        borderColor: 'warning.main',
                        borderRadius: 1,
                        bgcolor: 'warning.light',
                        color: 'warning.contrastText',
                        cursor: 'grab',
                        '&:hover': {
                          bgcolor: 'warning.main',
                        }
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <TransformIcon />
                        <Typography>Transform Node</Typography>
                      </Box>
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        Data transformation and formatting
                      </Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Box
                      draggable
                      onDragStart={(event) => onDragStart(event, 'output')}
                      sx={{
                        p: 2,
                        border: '1px solid',
                        borderColor: 'success.main',
                        borderRadius: 1,
                        bgcolor: 'success.light',
                        color: 'success.contrastText',
                        cursor: 'grab',
                        '&:hover': {
                          bgcolor: 'success.main',
                        }
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <OutputIcon />
                        <Typography>Output Node</Typography>
                      </Box>
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        Final output and result storage
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            </TabPanel>
            
            <TabPanel value={activeTab} index={1}>
              <Box sx={{ p: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Pipeline Settings
                </Typography>
                
                {pipeline && (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextField
                      fullWidth
                      label="Pipeline Name"
                      value={pipeline.name}
                      onChange={(e) => {
                        // Update pipeline name
                      }}
                    />
                    
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      label="Description"
                      value={pipeline.description}
                      onChange={(e) => {
                        // Update pipeline description
                      }}
                    />
                    
                    <FormControl fullWidth>
                      <InputLabel>Status</InputLabel>
                      <Select
                        value={pipeline.status}
                        label="Status"
                        onChange={(e) => {
                          // Update pipeline status
                        }}
                      >
                        <MenuItem value="draft">Draft</MenuItem>
                        <MenuItem value="active">Active</MenuItem>
                        <MenuItem value="inactive">Inactive</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                )}
              </Box>
            </TabPanel>
          </Paper>
        </Grid>
        
        {/* Canvas */}
        <Grid item xs={12} md={9}>
          <Paper 
            elevation={0} 
            ref={reactFlowWrapper} 
            sx={{ 
              borderRadius: 2, 
              height: '100%',
              overflow: 'hidden'
            }}
          >
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onInit={setReactFlowInstance}
              onDrop={onDrop}
              onDragOver={onDragOver}
              onNodeClick={handleNodeClick}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              fitView
            >
              <Controls>
                <ControlButton onClick={() => reactFlowInstance?.zoomIn()} title="Zoom in">
                  <ZoomInIcon />
                </ControlButton>
                <ControlButton onClick={() => reactFlowInstance?.zoomOut()} title="Zoom out">
                  <ZoomOutIcon />
                </ControlButton>
                <ControlButton onClick={() => reactFlowInstance?.fitView()} title="Fit view">
                  <CenterFocusIcon />
                </ControlButton>
              </Controls>
              <MiniMap />
              <Background variant="dots" gap={12} size={1} />
            </ReactFlow>
          </Paper>
        </Grid>
      </Grid>
      
      {/* Node Configuration Dialog */}
      <Dialog 
        open={openNodeDialog} 
        onClose={() => setOpenNodeDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Configure {selectedNode?.data?.label || 'Node'}
        </DialogTitle>
        <DialogContent>
          {selectedNode && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <TextField
                fullWidth
                label="Node Label"
                value={nodeData.label || ''}
                onChange={(e) => setNodeData({ ...nodeData, label: e.target.value })}
              />
              
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Description"
                value={nodeData.description || ''}
                onChange={(e) => setNodeData({ ...nodeData, description: e.target.value })}
              />
              
              {selectedNode.type === 'prompt' && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Prompt Configuration
                  </Typography>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    label="Prompt Template"
                    value={nodeData.promptTemplate || ''}
                    onChange={(e) => setNodeData({ ...nodeData, promptTemplate: e.target.value })}
                  />
                </Box>
              )}
              
              {selectedNode.type === 'api' && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    API Configuration
                  </Typography>
                  <TextField
                    fullWidth
                    label="API Endpoint"
                    value={nodeData.apiEndpoint || ''}
                    onChange={(e) => setNodeData({ ...nodeData, apiEndpoint: e.target.value })}
                  />
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            color="error" 
            onClick={() => {
              if (selectedNode) {
                handleDeleteNode(selectedNode.id);
                setOpenNodeDialog(false);
                setSelectedNode(null);
              }
            }}
          >
            Delete Node
          </Button>
          <Button onClick={() => setOpenNodeDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveNode}>Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PipelineBuilder;