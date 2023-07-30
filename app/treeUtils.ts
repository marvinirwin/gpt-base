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
}

// Function 1
export function createDocument(node: TreeNode): string {
    let document = node.answer;
    node.children.forEach(childNode => {
        document = document.replace(`{{ ${childNode.question} }}`, createDocument(childNode));
    });
    return document;
}

// Function 2
export function extractQuestions(node: TreeNode): string[] {
    const questionPattern = /{{ (.*?) }}/g;
    let match;
    const questions = [];
    while ((match = questionPattern.exec(node.answer)) !== null) {
        questions.push(match[1]);
    }
    return questions;
}

// Function 3
export async function generateNode(question: string, context: string, parentId: number | null): Promise<TreeNode> {
    const answer = await queryChatGPT(`Answer the following question: "${question}" 
    with the following context
    ${context}`);
    return {
        question,
        context,
        answer,
        parentId,
        id: Math.floor(Math.random() * 1000000), // Generate a random id
        children: [],
    };
}

// Function 4
export function insertNode(node: TreeNode, tree: TreeNode): TreeNode {
    if (tree.id === node.parentId) {
        tree.children.push(node);
    } else {
        tree.children.forEach(childNode => {
            insertNode(node, childNode);
        });
    }
    return tree;
}

// Function 5
export async function generateFirstNode(initialQuestion: string, initialContext: string): Promise<TreeNode> {
    return await generateNode(initialQuestion, initialContext, null);
}