"use client";

import { useCallback, useEffect, useState } from 'react';
import ReactFlow, {
    Background,
    Controls,
    Edge,
    Node,
    useNodesState,
    useEdgesState,
    Position,
    ConnectionLineType,
    MarkerType,
    Panel
} from 'reactflow';
import 'reactflow/dist/style.css';
import dagre from 'dagre';
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";


interface AgentGraphProps {
    spec: any;
    onAddStep?: () => void;
    onNodeClick?: (stepId: string) => void;
}

const nodeWidth = 172;
const nodeHeight = 36;
const getLayoutedElements = (nodes: Node[], edges: Edge[]) => {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));

    dagreGraph.setGraph({ rankdir: 'LR' });

    nodes.forEach((node) => {
        dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
    });

    edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    nodes.forEach((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);
        node.targetPosition = Position.Left;
        node.sourcePosition = Position.Right;

        // We are shifting the dagre node position (anchor=center center) to the top left
        // so it matches the React Flow node anchor point (top left).
        node.position = {
            x: nodeWithPosition.x - nodeWidth / 2,
            y: nodeWithPosition.y - nodeHeight / 2,
        };
    });

    return { nodes, edges };
};

export function AgentGraph({ spec, onAddStep, onNodeClick }: AgentGraphProps) {
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);

    // Handler for node clicks
    const handleNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
        if (onNodeClick) {
            onNodeClick(node.id);
        }
    }, [onNodeClick]);

    useEffect(() => {
        if (!spec || !spec.steps) return;

        // Convert spec steps to nodes
        const newNodes: Node[] = spec.steps.map((step: any) => ({
            id: step.id,
            data: { label: `${step.id} (${step.type})` },
            position: { x: 0, y: 0 }, // layout will handle this
            style: {
                border: step.type === 'llm' ? '1px solid #7c3aed' : '1px solid #2563eb',
                background: '#fff',
                padding: '10px',
                borderRadius: '5px',
                fontSize: '12px',
                width: nodeWidth
            }
        }));

        let newEdges: Edge[] = [];

        if (spec.edges && spec.edges.length > 0) {
            newEdges = spec.edges.map((edge: any, i: number) => ({
                id: `e${i}`,
                source: edge.from,
                target: edge.to,
                type: 'smoothstep',
                animated: true,
                markerEnd: { type: MarkerType.ArrowClosed },
            }));
        }

        const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
            newNodes,
            newEdges
        );

        setNodes(layoutedNodes);
        setEdges(layoutedEdges);

    }, [spec, setNodes, setEdges]);

    return (
        <div style={{ width: '100%', height: '100%' }}>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onNodeClick={handleNodeClick}
                fitView
            >
                <Background />
                <Controls />
                {onAddStep && (
                    <Panel position="top-right">
                        <Button size="sm" onClick={onAddStep} className="shadow-lg">
                            <Plus className="mr-2 h-4 w-4" />
                            Add Step
                        </Button>
                    </Panel>
                )}
            </ReactFlow>
        </div>
    );
}
