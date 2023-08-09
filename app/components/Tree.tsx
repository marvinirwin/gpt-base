import React from 'react';

interface NodeType {
    childNodes: NodeType[];
    label: string;
}

interface PositionedNode extends NodeType {
    x: number;
    y: number;
    childNodes: PositionedNode[];
}

const layoutTree = (root: NodeType, spacing = { x: 200, y: 50 }): PositionedNode => {
    let y = 0;

    const layoutDFS = (node: NodeType, x = 0): PositionedNode => {
        const childNodes = node.childNodes.map((child) => layoutDFS(child, x + spacing.x));
        return { ...node, childNodes, x, y: y++ * spacing.y };
    };

    return layoutDFS(root);
};

const NodeComponent: React.FC<PositionedNode & { width: number }> = ({ x, y, childNodes, label, width }) => (
    <svg>
        <circle cx={x} cy={y} r={width / 2} />
        <text x={x} y={y} textAnchor="middle" dy=".3em">{label}</text>
        {childNodes.map((child, i) => (
            <line key={i} x1={x} y1={y} x2={child.x} y2={child.y} stroke="black" />
        ))}
        {childNodes.map((child, i) => (
            <NodeComponent key={i} {...child} width={width} />
        ))}
    </svg>
);

export const TreeNodeComponent: React.FC<NodeType & { width: number }> = ({ childNodes, width }) => {
    const positionedRoot = layoutTree({ childNodes, label: 'root' });
    return <NodeComponent {...positionedRoot} width={width} />;
};

export interface TreeNode {
    question: string;
    context: string;
    answer: string;
    parentId: number | null;
    id: number;
    children: TreeNode[];
    summary: string;
}

export const convertToNodeType = (node: TreeNode): NodeType => {
    const { children, summary } = node;
    const childNodes = children.map(convertToNodeType);
    return { childNodes, label: summary };
};