import React, { useMemo, useEffect } from 'react';
import ReactFlow, {
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  useReactFlow,
} from 'reactflow';
import 'reactflow/dist/style.css';

const TaskGraph = ({ tasks, onNodeClick }) => {
  const { fitView } = useReactFlow();

  console.log('TaskGraph rendered with tasks:', tasks);

  // Generate nodes with dynamic positioning
  const initialNodes = useMemo(() => {
    return tasks.map((task, index) => ({
      id: task.id,
      data: {
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
      position: { x: (index % 4) * 250, y: Math.floor(index / 4) * 200 }, // Adjusted spacing
    }));
  }, [tasks]);

  // Generate edges
  const initialEdges = useMemo(
    () =>
      tasks
        .filter((task) => task.parentTaskId)
        .map((task) => ({
          id: `e${task.parentTaskId}-${task.id}`,
          source: task.parentTaskId,
          target: task.id,
          animated: true,
          style: { stroke: '#666', strokeWidth: 2 },
        })),
    [tasks]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Update nodes and edges when tasks change
  useEffect(() => {
    console.log('Updating nodes:', initialNodes);
    console.log('Updating edges:', initialEdges);
    setNodes(initialNodes);
    setEdges(initialEdges);
    if (tasks.length > 0) {
      setTimeout(() => {
        fitView({ padding: 0.3, duration: 800 }); // Increased padding for better fit
      }, 100);
    }
  }, [tasks, initialNodes, initialEdges, setNodes, setEdges, fitView]);

  return (
    <div style={{ width: '100%', height: '100%', background: 'transparent' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={(event, node) => onNodeClick(node.id)}
        fitView
        style={{ width: '100%', height: '100%', minHeight: '500px' }}
      >
        <Background color="#aaa" gap={16} />
        <Controls />
      </ReactFlow>
    </div>
  );
};

export default TaskGraph;