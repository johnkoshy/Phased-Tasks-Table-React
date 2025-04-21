import React, { useMemo, useEffect } from 'react';
import ReactFlow, {
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  useReactFlow,
} from 'reactflow';
import 'reactflow/dist/style.css';

// TaskGraph component to visualize tasks as a directed graph
const TaskGraph = ({ tasks, onNodeClick }) => {
  // Access React Flow utilities
  const { fitView } = useReactFlow();

  // Log tasks for debugging
  console.log('TaskGraph rendered with tasks:', tasks);

  // Generate nodes with dynamic positioning based on task data
  const initialNodes = useMemo(() => {
    return tasks.map((task, index) => ({
      id: task.id,
      data: {
        // Custom node label with task title and assignee
        label: (
          <div
            style={{
              padding: '8px',
              background: '#fff',
              borderRadius: '4px',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
              maxWidth: '200px', // Limit node width for readability
              textAlign: 'center',
            }}
          >
            <div style={{ fontWeight: 'bold', color: '#333' }}>{task.title}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              Assigned: {task.assignedTo}
            </div>
          </div>
        ),
      },
      // Grid-like positioning for nodes (4 columns, adjustable rows)
      position: { x: (index % 4) * 250, y: Math.floor(index / 4) * 200 },
    }));
  }, [tasks]);

  // Generate edges to represent parent-child task relationships
  const initialEdges = useMemo(() => {
    return tasks
      .filter((task) => task.parentTaskId) // Only include tasks with a parent
      .map((task) => ({
        id: `e${task.parentTaskId}-${task.id}`, // Unique edge ID
        source: task.parentTaskId,
        target: task.id,
        animated: true, // Animate edges for visual feedback
        style: { stroke: '#666', strokeWidth: 2 }, // Edge styling
      }));
  }, [tasks]);

  // Manage nodes and edges state with React Flow hooks
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Update nodes, edges, and fit view when tasks change
  useEffect(() => {
    console.log('Updating nodes:', initialNodes);
    console.log('Updating edges:', initialEdges);
    setNodes(initialNodes); // Sync nodes with new task data
    setEdges(initialEdges); // Sync edges with new task relationships
    if (tasks.length > 0) {
      // Delay fitView to ensure nodes are rendered
      setTimeout(() => {
        fitView({ padding: 0.3, duration: 800 }); // Adjust view with padding and animation
      }, 100);
    }
  }, [tasks, initialNodes, initialEdges, setNodes, setEdges, fitView]);

  return (
    // Container for the React Flow graph
    <div style={{ width: '100%', height: '100%', background: 'transparent' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange} // Handle node updates
        onEdgesChange={onEdgesChange} // Handle edge updates
        onNodeClick={(event, node) => onNodeClick(node.id)} // Handle node clicks
        fitView // Auto-fit view on initial render
        style={{ width: '100%', height: '100%', minHeight: '500px' }} // Ensure minimum height
      >
        <Background color="#aaa" gap={16} /> {/* Add grid background */}
        <Controls /> {/* Add zoom and pan controls */}
      </ReactFlow>
    </div>
  );
};

export default TaskGraph;