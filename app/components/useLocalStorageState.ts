import {useEffect, useState} from "react";
import {PromptStages} from "~/components/PipelineComponent";
export interface PipelineState {
    id?: string;
    prompt: string;
    result?: string;
    stage?: PromptStages;
    nextPrompt?: string;
    pipelineState?: PromptStages;
    verificationPrompt?: string;
    fixingPrompt?: string;
    uuid: string;
    summary?: string;
}


export const useLocalStorageState = (key: string, defaultValue: PipelineState[]) => {
    const [state, setState] = useState<PipelineState[]>(() => {
        if (global.localStorage) {
            const storedValue = localStorage.getItem(key);
            return storedValue !== null ? JSON.parse(storedValue) : defaultValue;
        }
        return defaultValue;
    });

    useEffect(() => {
        localStorage.setItem(key, JSON.stringify(state));
    }, [key, state]);

    return [state, setState] as const;
};
