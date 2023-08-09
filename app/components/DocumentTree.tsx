import {TreeNode} from "~/components/Tree";
import React from "react";
import RenderGreen from "~/components/RenderGreen";
import {createDocument} from "~/treeUtils";

interface DocumentNodeProps {
    node: TreeNode;
}

interface DocumentTreeProps {
    rootNode: TreeNode;
}

const DocumentNodeComponent: React.FC<DocumentNodeProps> = ({node}) => {
    return (
        <div style={{width: '100%', border: '1px solid black', marginBottom: '10px'}}>
            <RenderGreen input={createDocument(node)}/>
            <RenderGreen input={node.context}/>
            <RenderGreen input={node.question}/>
            {node.children.map((childNode, index) => (
                <DocumentNodeComponent key={index} node={childNode}/>
            ))}
        </div>
    );
};
const DocumentTree: React.FC<DocumentTreeProps> = ({rootNode}) => (
    <div style={{width: '100%'}}>
        <DocumentNodeComponent node={rootNode}/>
    </div>
);
export const baseTreeNode: TreeNode = {
    question: `
    `,
    context: `
        Respond to the following in markdown.
        Concerning a research project which answers the question "To what extent does China’s dual circulation strategy affect foreign pharmaceutical companies operating in China?" for a bachelors in international business in Asia. 
        For any part of my requests which requires more detail or outside information, leave a placeholder 
        {{Use the contents of the brackets to ask me for more information, like research papers, or just more detailed sections}}.
        Be EXTREMELY liberal with your placeholders.  
        I need each section to be extremely detailed and sourced, 
        so ANY points of ambiguity should be wrapped in these double curly braces and have a well formed question inside.
    `,
    answer: "",
    parentId: null,
    id: -1,
    summary: "Base Node",
    children: []
}