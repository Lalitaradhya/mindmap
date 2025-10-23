import { useState, useEffect, useMemo } from 'react';
import { Box, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ReactFlow, { ReactFlowProvider, MiniMap, Controls, Background, useNodesState, useEdgesState } from 'reactflow';
import 'reactflow/dist/style.css';
import Footer from './Footer';
import { buildElements } from './mindmap/mindmapUtils';
import PrimaryNode from './mindmap/PrimaryNode';

const nodeTypes = {
  primaryNode: PrimaryNode,
};
const edgeTypes = {};

const Mindmap = () => {
  const memoizedNodeTypes = useMemo(() => nodeTypes, []);
  const memoizedEdgeTypes = useMemo(() => edgeTypes, []);
  const [mindMapData, setMindMapData] = useState(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges] = useEdgesState([]);
  const [expandedNodes, setExpandedNodes] = useState({});
  const navigate = useNavigate();

  const handleToggleExpand = (nodeId) => {
    setExpandedNodes(prev => ({
      ...prev,
      [nodeId]: !prev[nodeId]
    }));
  };

  useEffect(() => {
    const savedMindMapData = localStorage.getItem('mindMapData');
    if (savedMindMapData) {
      const parsedData = JSON.parse(savedMindMapData);
      setMindMapData(parsedData);
      
      // Build ReactFlow elements
      const { nodes: builtNodes, edges: builtEdges } = buildElements(
        parsedData.word,
        parsedData.meaning,
        parsedData.synonyms || [],
        parsedData.primaryBranches || [],
        expandedNodes,
        handleToggleExpand
      );
      setNodes(builtNodes);
      setEdges(builtEdges);
    }
  }, [setNodes, setEdges, expandedNodes]);

  if (!mindMapData) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
          <Typography variant="h4" component="h1" gutterBottom sx={{ color: '#1976d2', fontWeight: 'bold' }}>
            No Mindmap Data Found
          </Typography>
          <Typography variant="body1" sx={{ mb: 3, textAlign: 'center' }}>
            Please generate a mindmap first from the home page.
          </Typography>
          <Button variant="contained" onClick={() => navigate('/')}>
            Go to Home
          </Button>
        </Box>
        <Footer />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ flexGrow: 1, p: { xs: 0, sm: 0, md: 2 } }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ color: '#1976d2', textAlign: 'center', display: { xs: 'none', sm: 'none', md: 'block' } }}>
          Mindmap: {mindMapData.word}
        </Typography>
        <Box sx={{ height: { xs: '94vh', sm: '94vh', md: 'calc(100vh - 200px)' }, width: '100%' }}>
          <ReactFlowProvider>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              nodeTypes={memoizedNodeTypes}
              edgeTypes={memoizedEdgeTypes}
              fitView
              attributionPosition="bottom-left"
            >
              <MiniMap />
              <Controls />
              <Background />
            </ReactFlow>
          </ReactFlowProvider>
        </Box>
      </Box>
      <Box sx={{ display: { xs: 'none', sm: 'none', md: 'block' } }}>
        <Footer />
      </Box>
    </Box>
  );
};

export default Mindmap;
