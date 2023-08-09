import React, {useEffect, useRef, useState} from 'react';
import {type ActionArgs} from '@remix-run/node';
import {Form, useActionData, useLocation, useNavigate, useNavigation, useSubmit} from '@remix-run/react';
import {Send as SendIcon} from '~/components/Icons';
import {generateNode, insertNode} from "~/treeUtils";
import type {ReturnedDataProps} from "~/types";
import {useAllQuestions} from "~/routes/useAllQuestions";
import {convertToNodeType, TreeNode, TreeNodeComponent} from "~/components/Tree";
import {baseTreeNode} from "~/components/DocumentTree";

type GenerateNodeParams = { question: string, context: string, id: string | number };
const functionMap = {
    generateNode: async (params: GenerateNodeParams) => {
        const { question, context, id } = params;
        return await generateNode(question, context, id);
    },
    // Add other functions here
};
/**
 *
 * API call executed server side
 */
export async function action({request}: ActionArgs): Promise<ReturnedDataProps> {
    const body = await request.formData();
    const functionName = body.get('functionName') as string;
    const functionParameters = JSON.parse(body.get('functionParameters') as string);

    const functionToCall = functionMap[functionName as keyof typeof functionMap];
    if (functionToCall) {
        try {
            const result = await functionToCall(functionParameters);
            return {
                newNode: result
            };
        } catch (error: any) {
            return {
                error: error
            };
        }
    } else {
        throw new Error(`Function ${functionName} not found`);
    }
}

export default function IndexPage() {
    const [documentTree, setDocumentTree] = useState<TreeNode>(baseTreeNode);
    useEffect(() => {
        // Load initial state from localStorage
        try {
            const v = JSON.parse(localStorage.getItem('tree') || "");
            debugger;
            setDocumentTree(v)
        } catch (e) {
            setDocumentTree(baseTreeNode)
        }

    }, []);

    const [question, setQuestion] = useState<string>("");
    const [selectedNode, setSelectedNode] = useState<TreeNode>(baseTreeNode);
    const allQuestions = useAllQuestions(documentTree);
    useEffect(() => {
        setQuestion(allQuestions[0]);
    }, [selectedNode, allQuestions]);

    const minTextareaRows = 1;
    const maxTextareaRows = 50;

    const data = useActionData<typeof action>();
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const formRef = useRef<HTMLFormElement>(null);
    const navigation = useNavigation();
    const submit = useSubmit();

    const callFunction = (functionName: string, functionParameters: any) => {
        let $form = formRef.current;
        if (!$form) {
            return;
        }
        const formData = new FormData($form);
        formData.set('functionName', functionName);
        formData.set('functionParameters', JSON.stringify(functionParameters));
        submit(formData, {replace: true, method: 'post'});
    };

    const location = useLocation();
    const navigate = useNavigate();
    const isSubmitting = navigation.state === 'submitting';

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
            handleFormSubmit()
        }
    }
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

    const handleFormSubmit = () => {
        let $form = formRef.current;
        if (!$form) {
            return;
        }
        const formData = new FormData($form);
        if (!question) {
            formData.set('question', inputRef.current?.value || "")
            formData.set('context', selectedNode.context)
            formData.set('parentNode', JSON.stringify(selectedNode))
        } else {
            formData.set('question', question)
            formData.set('context', question)
            formData.set('parentNode', JSON.stringify(selectedNode))
        }
        submit(formData, {replace: true, method: 'post'});
    };

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
                        id="context"
                        aria-disabled={isSubmitting}
                        ref={inputRef}
                        className="auto-growing-input m-0 appearance-none text-black placeholder:text-black resize-none text-sm md:text-base py-3 pl-5 pr-14 border border-slate-400 outline-none rounded-4xl w-full block leading-6 bg-white"
                        placeholder=""
                        name="message"
                        onKeyDown={handleKeyDown}
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
                </div>
            </Form>
            <TreeNodeComponent label={"root"} width={50} childNodes={[convertToNodeType(documentTree)]} />
            <div>
                SelectedNode: {selectedNode.question}
                <br/>
                Question: {question}
            </div>
        </div>
    )
}