// MyFormComponent.js

import React, {useEffect, useRef, useState} from 'react';
import {Form, useNavigate, useSubmit} from '@remix-run/react';
import {Send as SendIcon} from '~/components/Icons';
import {convertToNodeType, TreeNode, TreeNodeComponent} from "~/components/Tree";
import {baseTreeNode} from "~/components/DocumentTree";
import {insertNode} from "~/treeUtils";
import {useCallBackendFunctionSubmit} from "~/backendFns";
import {useAllQuestions} from "~/useAllQuestions";

const minTextareaRows = 1;
const maxTextareaRows = 50;
export const AskCurlyBraceQuestionToGenerateNode = (
    {isSubmitting, data}
        :{
            isSubmitting: boolean;
            data: any
        }
) => {
    useEffect(() => {
        // Load initial state from localStorage
        try {
            const v = JSON.parse(localStorage.getItem('tree') || "");
            setDocumentTree(v)
        } catch (e) {
            setDocumentTree(baseTreeNode)
        }

    }, []);
    const [documentTree, setDocumentTree] = useState<TreeNode>(baseTreeNode);
    const [selectedNode, setSelectedNode] = useState<TreeNode>(baseTreeNode);
    const [textValue ,setTextValue] = useState<string>("");
    const [question, setQuestion] = useState<string>("");
    const callFunction = useCallBackendFunctionSubmit(useSubmit());
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const formRef = useRef<HTMLFormElement>(null);
    const allQuestions = useAllQuestions(documentTree);
    const navigate = useNavigate();
    useEffect(() => {
        setQuestion(allQuestions[0]);
    }, [selectedNode, allQuestions]);
    const handleFormSubmit = () => {
        if (question) {
            callFunction('generateNode', {
                question: textValue,
                context: textValue,
                id: selectedNode.id,
                parentNode: selectedNode
            });
        } else {
            callFunction('generateNode', {
                question: textValue,
                context: selectedNode.context,
                id: selectedNode.id,
                parentNode: selectedNode
            });
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {

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
        setTextValue(event.target.value);
    };
    useEffect(() => {
        // @ts-ignore
        if (data?.newNode) {
            // @ts-ignore
            setDocumentTree(insertNode(data.newNode, documentTree));
        }
    }, [data, navigate, documentTree, setDocumentTree]);

    return (
        <Form
            aria-disabled={isSubmitting}
            method="post"
            ref={formRef}
            onSubmit={handleFormSubmit}
            replace
            className="max-w-[500px] mx-auto"
        >
            <div className="input-wrap relative flex items-center">
                <label htmlFor="message" className="absolute left[-9999px] w-px h-px overflow-hidden">prompt for a new
                    document</label>
                <textarea
                    id="context"
                    aria-disabled={isSubmitting}
                    value={textValue}
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
                <div>
                    SelectedNode: {selectedNode.question}
                    <br/>
                    Question: {question}
                </div>
            </div>
            <TreeNodeComponent label={"root"} width={50}
                               childNodes={[convertToNodeType(documentTree)]} />
        </Form>
    )
}
