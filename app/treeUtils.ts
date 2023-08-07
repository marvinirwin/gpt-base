import fs from "fs";
const queryChatGPT = async (prompt: string): Promise<string> => {
    // @ts-ignore
    const { ChatGPTAPI } = await import('chatgpt')
    const api = new ChatGPTAPI({
        apiKey: process.env.OPENAI_API_KEY as string,
        completionParams: {model: 'gpt-4-0613'},
        maxModelTokens: 8100
    });
    const cacheFile = './chatgpt-cache.json';
    const cache = fs.existsSync(cacheFile)
        ? JSON.parse(fs.readFileSync(cacheFile, 'utf-8'))
        : {};

    if (cache[prompt]) {
        return cache[prompt];
    }

    return await api
        .sendMessage(prompt)
        // @ts-ignore
        .then((response) => {
            let text = response.text /*response.data.choices[0].text*/ as string;

            // Save the result in the cache and store it in a JSON file
            cache[prompt] = text;
            fs.writeFileSync(cacheFile, JSON.stringify(cache));

            return text;
        })
        .catch((e) => {
            console.log(prompt);
            console.error(e);
            throw e.response.data;
        });
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
// Function 1
export function createDocument(node: TreeNode): string {
    let document = node.answer;
    node.children.forEach(childNode => {
        document = document.replace(`{{ ${childNode.question} }}`, createDocument(childNode));
    });
    return document;
}
export async function generateNode(question: string, context: string, parentId: number | null): Promise<TreeNode> {
    const prompt = `Answer the following question: "${question}" 
    with the following context
    ${context}`;
    console.log(prompt);
    const answer = await queryChatGPT(prompt);
    const summary = await queryChatGPT(`Can you summarize the following part of a document.  The double curly braces enclosed sentences represent questions/sections which need more context/detail.
    ${answer}`);
    return {
        question,
        context,
        answer,
        summary,
        parentId,
        id: Math.floor(Math.random() * 1000000), // Generate a random id
        children: [],
    };
}
export function insertNode(node: TreeNode, tree: TreeNode): TreeNode {
    if (tree.id === node.parentId) {
        tree.children.push(node);
    } else {
        tree.children.forEach(childNode => {
            insertNode(node, childNode);
        });
    }
    return node;
}
export async function generateFirstNode(initialQuestion: string, initialContext: string): Promise<TreeNode> {
    return await generateNode(initialQuestion, initialContext, null);
}