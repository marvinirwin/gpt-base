import {useFetcher} from '@remix-run/react';
import React, { useState, useEffect, KeyboardEvent } from 'react';
import {useCallBackendFunctionFetcher} from "~/backendFns";

type VerificationResult = {
    correct: boolean;
    reason: string;
};

type PipelineProps = {
    initialPromptProp: string;
    verificationPromptProp?: string;
    fixingPromptProp?: string;
    loadingStringProp?: string;
    pipelineId?: string;
    resultProp?: string;
};

export enum PromptStages {
    UnStarted="UnStarted",
    Verification = "Verification",
    Fixing = "Fixing",
    Finished="Finished",
}
export const PipeLineComponent: React.FC<PipelineProps> = (
    {
        initialPromptProp,
        verificationPromptProp,
        fixingPromptProp,
        resultProp,
        pipelineId
    }) => {
    const startPipelineFetcher = useFetcher();
    const callFunctionStartPipelineFetcher = useCallBackendFunctionFetcher(startPipelineFetcher);
    const modifyVerificationPromptFetcher = useFetcher();
    const callModifyVerificationPromptFetcher = useCallBackendFunctionFetcher(modifyVerificationPromptFetcher);
    const fixingPromptFetcher = useFetcher();
    const callFixingPromptFetcher = useCallBackendFunctionFetcher(fixingPromptFetcher);
    const [pipelineStage, setPipelineStage] = useState<PromptStages>(PromptStages.UnStarted);
    const [result, setResult] = useState<string>(resultProp || "");
    const [nextPrompt, setNextPrompt] = useState<string>("");
    const [verificationPromptState, setVerificationPromptState] = useState(
        verificationPromptProp
    );
    const [fixingPromptState, setFixingPromptState] = useState(fixingPromptProp);
    const [processId, setProcessId] = useState('');
    const isEditingVerificationPrompt = pipelineStage === PromptStages.Verification;
    const isEditingFixingPrompt = pipelineStage === PromptStages.Fixing;
    useEffect(() => {
        if (!pipelineId) {
            // Start the fetch
            callFunctionStartPipelineFetcher('beginPipeline', {prompt: initialPromptProp})
        }
    }, [])
    // Get the result of the startPipelineFetcher
    useEffect(() => {
        if (startPipelineFetcher.data) {
            setProcessId(startPipelineFetcher.data.id);
            setVerificationPromptState(startPipelineFetcher.data.prompt);
            setPipelineStage(PromptStages.Verification);
        }
    }, [startPipelineFetcher.data])

    // Submit the modified verification prompt
    const submitVerificationPrompt = (newPrompt: string) => {
        callModifyVerificationPromptFetcher(
             'modifyVerificationPrompt',
             {
                id: processId,
                prompt: newPrompt
            }
        )
    }
    // Receive the fixing prompt, or mark the whole thing as completed
    useEffect(() => {
        if (modifyVerificationPromptFetcher.data) {
            if (modifyVerificationPromptFetcher.data.stage === PromptStages.Finished) {
                setResult(modifyVerificationPromptFetcher.data.result);
                setPipelineStage(PromptStages.Finished);
            } else {
                setFixingPromptState(modifyVerificationPromptFetcher.data.prompt);
                setPipelineStage(PromptStages.Fixing);
            }
        }
    }, [modifyVerificationPromptFetcher.data])

    const submitFixingPrompt = (newPrompt: string) => {
        callFixingPromptFetcher(
             'modifyFixingPrompt',
             {
                id: processId,
                prompt: newPrompt
            }
        )
    }
    useEffect(() => {
        if (fixingPromptFetcher.data) {
            if (fixingPromptFetcher.data.pipelineState === PromptStages.Finished) {
                setResult(fixingPromptFetcher.data.result);
                setPipelineStage(PromptStages.Fixing);
            } else {
                setNextPrompt(fixingPromptFetcher.data.nextPrompt)
            }
            setPipelineStage(PromptStages.Finished);
        }
    }, [fixingPromptFetcher.data])

    const handleKeyDown = (
        event: KeyboardEvent<HTMLTextAreaElement>,
        promptType: 'verification' | 'fixing'
    ) => {
        if (event.key === 'Enter' && event.ctrlKey) {
            const newPrompt = (event.target as HTMLTextAreaElement).value;
            if (isEditingFixingPrompt && promptType === 'fixing') {
                submitFixingPrompt(newPrompt)
            }
            if (isEditingVerificationPrompt && promptType === 'verification') {
                submitVerificationPrompt(newPrompt);
            }
        }
    };

    return (
        <div className="flex flex-col w-full px-4">
            <div className="text-lg font-bold mb-4">ProcessId: {processId} Stage: {pipelineStage}</div>

            <label className="mb-2">
                <span className="text-sm font-medium text-gray-700">Initial Prompt:</span>
                <textarea className="mt-1 p-2 w-full h-20 border rounded-md" readOnly value={initialPromptProp} />
            </label>

            <label className="mb-2">
                <span className="text-sm font-medium text-gray-700">Verification Prompt:</span>
                <textarea
                    className="mt-1 p-2 w-full h-20 border rounded-md"
                    value={verificationPromptState}
                    onChange={(event) => setVerificationPromptState(event.target.value)}
                    onKeyDown={(event) => handleKeyDown(event, 'verification')}
                />
            </label>

            <label className="mb-2">
                <span className="text-sm font-medium text-gray-700">Fixing Prompt:</span>
                <textarea
                    className="mt-1 p-2 w-full h-20 border rounded-md"
                    value={fixingPromptState}
                    onChange={(event) => setFixingPromptState(event.target.value)}
                    onKeyDown={(event) => handleKeyDown(event, 'fixing')}
                />
            </label>

            <label className="mb-2">
                <span className="text-sm font-medium text-gray-700">Result:</span>
                <textarea
                    className="mt-1 p-2 w-full h-20 border rounded-md"
                    value={result}
                    onChange={(event) => setFixingPromptState(event.target.value)}
                    onKeyDown={(event) => handleKeyDown(event, 'fixing')}
                />
            </label>
        </div>
    );
};