import React, { useCallback } from 'react';
import {
  Box,
  Typography,
  useTheme,
  alpha,
} from '@mui/material';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  BackgroundVariant,
  NodeChange,
  EdgeChange,
  MarkerType,
} from 'reactflow';

interface PipelineCanvasProps {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  onNodeClick?: (event: React.MouseEvent, node: Node) => void;
  onNodeDoubleClick?: (event: React.MouseEvent, node: Node) => void;
  onPaneClick?: (event: React.MouseEvent) => void;
  readonly?: boolean;
}

const PipelineCanvas: React.FC<PipelineCanvasProps> = ({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onNodeClick,
  onNodeDoubleClick,
  onPaneClick,
  readonly = false,
}) => {
  const theme = useTheme();

  const handleConnect = useCallback(
    (params: Connection) => {
      if (!readonly) {
        onConnect(params);
      }
    },
    [onConnect, readonly]
  );

  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      if (!readonly) {
        onNodesChange(changes);
      }
    },
    [onNodesChange, readonly]
  );

  const handleEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      if (!readonly) {
        onEdgesChange(changes);
      }
    },
    [onEdgesChange, readonly]
  );

  if (nodes.length === 0) {
    return (
      <Box
        sx={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.palette.grey[50],
          border: `2px dashed ${theme.palette.grey[300]}`,
          borderRadius: 2,
        }}
      >
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Empty Pipeline Canvas
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {readonly 
              ? 'No pipeline steps to display'
              : 'Drag components from the sidebar to build your pipeline'
            }
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', width: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={handleConnect}
        onNodeClick={onNodeClick}
        onNodeDoubleClick={onNodeDoubleClick}
        onPaneClick={onPaneClick}
        nodesDraggable={!readonly}
        nodesConnectable={!readonly}
        elementsSelectable={!readonly}
        panOnDrag={true}
        zoomOnScroll={true}
        zoomOnPinch={true}
        zoomOnDoubleClick={false}
        fitView
        fitViewOptions={{
          padding: 0.1,
          includeHiddenNodes: false,
        }}
        style={{
          backgroundColor: theme.palette.grey[50],
        }}
        defaultEdgeOptions={{
          type: 'smoothstep',
          style: {
            stroke: theme.palette.primary.main,
            strokeWidth: 2,
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: theme.palette.primary.main,
          },
        }}
      >
        <Controls
          showZoom={true}
          showFitView={true}
          showInteractive={!readonly}
          style={{
            backgroundColor: theme.palette.background.paper,
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: theme.shape.borderRadius,
          }}
        />
        
        <Background 
          variant={BackgroundVariant.Dots} 
          gap={20}
          size={1}
          color={alpha(theme.palette.text.secondary, 0.3)}
        />
      </ReactFlow>
    </Box>
  );
};

export default PipelineCanvas;