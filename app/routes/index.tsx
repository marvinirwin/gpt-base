import React, {useRef, useEffect, useCallback, useState, useMemo} from 'react';

import {type ActionArgs} from '@remix-run/node';
import {Form, useActionData, useNavigation, Link, useSubmit, useLocation, useNavigate} from '@remix-run/react';
import {Send as SendIcon} from '~/components/Icons';
import fs from "fs";
import {createDocument, extractQuestions, generateNode, insertNode, TreeNode} from "~/treeUtils";

interface DocumentNodeProps {
    node: TreeNode;
}

export type ReturnedDataProps = {
    newNode: TreeNode
} | {
    error: string;
}

interface DocumentTreeProps {
    rootNode: TreeNode;
}


const DocumentNodeComponent: React.FC<DocumentNodeProps> = ({node}) => {
    return (
        <div style={{width: '100%', border: '1px solid black', marginBottom: '10px'}}>
            <h3>{createDocument(node)}</h3>
            <p>{node.context}</p>
            <p>{node.question}</p>
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

/**
 * API call executed server side
 */
export async function action({request}: ActionArgs): Promise<ReturnedDataProps> {
    const body = await request.formData();
    const question = body.get('question') as string;
    const context = body.get('context') as string;

    const chatHistory = JSON.parse(body.get('parentNode') as string) as TreeNode;

    try {
        return {
            newNode: await generateNode(
                question,
                context,
                chatHistory.id
            )
        };
    } catch (error: any) {
        return {
            error: error
        };
    }
}

const baseTreeNode: TreeNode = {
    question: "",
    context: "",
    answer: "",
    parentId: null,
    id: -1,
    children: []
}
export default function IndexPage() {
    const [documentTree, setDocumentTree] = useState<TreeNode>(
        () => {
        // Load initial state from localStorage
        try {
            return JSON.parse(localStorage.getItem('tree') || "");
        } catch (e) {
            return baseTreeNode;
        }

    }
    );
    const [question, setQuestion] = useState<string>("");
    const [selectedNode, setSelectedNode] = useState<TreeNode>(baseTreeNode);
    const allQuestions = useMemo(
        () => extractQuestions(documentTree),
        [documentTree]
    );

    const minTextareaRows = 1;
    const maxTextareaRows = 3;

    const data = useActionData<typeof action>();
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const formRef = useRef<HTMLFormElement>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const navigation = useNavigation();
    const submit = useSubmit();

    const location = useLocation();
    const navigate = useNavigate();
    const isSubmitting = navigation.state === 'submitting';

    /**
     * Handles the change event of a textarea element and adjusts its height based on the content.
     * Note: Using the ref to alter the rows rather than state since it's more performant / faster.
     * @param event - The change event of the textarea element.
     */
    const handleTextareaChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        if (!inputRef.current) {
            return;
        }

        // reset required for when the user pressed backspace (otherwise it would stay at max rows)
        inputRef.current.rows = minTextareaRows;

        const lineHeight = parseInt(window.getComputedStyle(inputRef.current).lineHeight);
        const paddingTop = parseInt(window.getComputedStyle(inputRef.current).paddingTop);
        const paddingBottom = parseInt(window.getComputedStyle(inputRef.current).paddingBottom);
        const scrollHeight = inputRef.current.scrollHeight - paddingTop - paddingBottom;
        const currentRows = Math.floor(scrollHeight / lineHeight);

        if (currentRows >= maxTextareaRows) {
            inputRef.current.rows = maxTextareaRows;
            inputRef.current.scrollTop = event.target.scrollHeight;
        } else {
            inputRef.current.rows = currentRows;
        }
    };


    /**
     * Ensure the user message is added to the chat on submit (button press)
     * @param event Event from the form
     */
    const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        const formData = new FormData(event.target as HTMLFormElement);
        const message = formData.get('message');
        submit(formRef.current, {replace: true});
    };

    /**
     * Submits the form when the user pressed enter but not shift + enter
     * Also saves a mesasge to the the chat history
     *
     * @param event The keydown event
     */
    const submitFormOnEnter = useCallback((event: React.KeyboardEvent<HTMLTextAreaElement>) => {
        const value = (event.target as HTMLTextAreaElement).value;

        if (event.key === 'Enter' && !event.shiftKey && value.trim().length > 2) {
            submit(formRef.current, {replace: true});
        }
    }, [submit, formRef]);

    /**
     * Focuses the input element when the page is loaded and clears the
     * input when the form is submitted
     */
    useEffect(() => {
        if (!inputRef.current) {
            return;
        }

        if (navigation.state === 'submitting') {
            inputRef.current.value = '';
            inputRef.current.rows = 1;
        } else {
            inputRef.current.focus();
        }
    }, [navigation.state]);

    /**
     * Adds the API's response message to the chat history
     * when the data comes back from the action method
     */
    useEffect(() => {
        // @ts-ignore
        if (data?.newNode) {
            // @ts-ignore
            setDocumentTree(insertNode(data.newNode, documentTree));
        }
    }, [data, navigate, documentTree, setDocumentTree]);

    return (
        <div>
            <Form
                aria-disabled={isSubmitting}
                method="post"
                ref={formRef}
                onSubmit={handleFormSubmit}
                replace
                className="max-w-[500px] mx-auto"
            >
                <div className="input-wrap relative flex items-center">
                    <label htmlFor="message" className="absolute left[-9999px] w-px h-px overflow-hidden">prompt for a
                        new document</label>
                    <textarea
                        id="message"
                        aria-disabled={isSubmitting}
                        ref={inputRef}
                        className="auto-growing-input m-0 appearance-none text-black placeholder:text-black resize-none text-sm md:text-base py-3 pl-5 pr-14 border border-slate-400 outline-none rounded-4xl w-full block leading-6 bg-white"
                        placeholder=""
                        name="message"
                        onChange={handleTextareaChange}
                        required
                        rows={1}
                        minLength={2}
                        disabled={isSubmitting}
                    />
                    <button
                        aria-label="Submit"
                        aria-disabled={isSubmitting}
                        className="absolute right-0 flex-shrink-0 items-center appearance-none text-black h-[50px] w-[50px] border-none cursor-pointer shadow-none rounded-4xl grid place-items-center group transition-colors disabled:cursor-not-allowed focus:outline-dark-blue"
                        type="submit"
                        disabled={isSubmitting}
                    >
                        <SendIcon/>
                    </button>
                    <input
                        type="hidden"
                        value={JSON.stringify(documentTree)} name="chat-history"
                    />
                    <input
                        type="hidden"
                        value={question} name="chat-history"
                    />

                </div>
            </Form>
            <DocumentTree rootNode={documentTree}/>
        </div>
    )
}

export function ErrorBoundary({error}: { error: Error }) {
    return (
        <main
            className="container mx-auto rounded-lg h-full grid grid-rows-layout p-4 pb-0 sm:p-8 sm:pb-0 max-w-full sm:max-w-auto">
            <div className="chat-container">
                <div className="intro grid place-items-center h-full text-center">
                    <div className="intro-content inline-block px-4 py-8 border border-error rounded-lg">
                        <h1 className="text-3xl font-semibold">Oops, something went wrong!</h1>
                        <p className="mt-4 text-error ">{error.message}</p>
                        <p className="mt-4"><Link to="/">Back to chat</Link></p>
                    </div>
                </div>
            </div>
        </main>
    );
}