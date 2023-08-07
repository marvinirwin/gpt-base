import React from 'react';

interface NodeType {
    children: NodeType[];
    label: string;
}

interface PositionedNode extends NodeType {
    x: number;
    y: number;
    label: string;
}

const layoutTree = (root: NodeType, spacing = { x: 200, y: 50 }): PositionedNode => {
    let y = 0;

    const layoutDFS = (node: NodeType, x = 0): PositionedNode => {
        const children = node.children.map((child) => layoutDFS(child, x + spacing.x));
        return { ...node, children, x, y: y++ * spacing.y };
    };

    return layoutDFS(root);
};

const NodeComponent: React.FC<PositionedNode & { width: number }> = ({ x, y, children, width }) => (
    <svg>
        <circle cx={x} cy={y} r={width / 2} />
        {children.map((child, i) => (
            <line key={i} x1={x} y1={y} x2={child.x} y2={child.y} stroke="black" />
        ))}
        {children.map((child, i) => (
            <NodeComponent key={i} {...child} width={width} />
        ))}
    </svg>
);

const TreeNodeComponent: React.FC<NodeType & { width: number }> = ({ children, width }) => {
    const positionedRoot = layoutTree({ children });
    return <NodeComponent {...positionedRoot} width={width} />;
};