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

  const initialNodes = useMemo(() => 
    tasks.map((task, index) => ({
      id: task.id,
      data: { 
        label: (
          <div style={{ padding: '8px' }}>
            <div style={{ fontWeight: 'bold' }}>{task.title}</div>
            <div>Assigned: {task.assignedTo}</div>
          </div>
        ),
      },
      position: { x: index * 250, y: index % 2 === 0 ? 0 : 100 },
    })), 
    [tasks]
  );

  const initialEdges = useMemo(() =>
    tasks
      .filter((task) => task.parentTaskId)
      .map((task) => ({
        id: `e${task.parentTaskId}-${task.id}`,
        source: task.parentTaskId,
        target: task.id,
        animated: true,
      })),
    [tasks]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  useEffect(() => {
    console.log('Nodes:', initialNodes);
    console.log('Edges:', initialEdges);
    setNodes(initialNodes);
    setEdges(initialEdges);
    if (tasks.length > 0) {
      fitView({ padding: 0.2, duration: 800 });
    }
  }, [tasks, initialNodes, initialEdges, setNodes, setEdges, fitView]);

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={(event, node) => onNodeClick(node.id)}
        fitView
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
};

export default TaskGraph;