import {useFetcher, useSubmit} from "@remix-run/react";
import {generateNode} from "~/treeUtils";
import {processPrompt, PromptStages} from "~/Pipeline";
import {v4 as uuidv4} from "uuid";

export function useCallBackendFunctionSubmit(submit: ReturnType<typeof useSubmit>) {
    const callFunction = (functionName: string, functionParameters: any) => {
        const formData = new FormData();
        formData.set('functionName', functionName);
        formData.set('functionParameters', JSON.stringify(functionParameters));
        submit(formData, {replace: true, method: 'post'});
    };
    return callFunction
}

export function useCallBackendFunctionFetcher(fetcher: ReturnType<typeof useFetcher<any>>) {

    const callFunction = async (functionName: string, functionParameters: any) => {
        const formData = new FormData();
        formData.set('functionName', functionName);
        formData.set('functionParameters', JSON.stringify(functionParameters));

        await fetcher.submit(
            formData,
            {
                method: 'post',
                replace: true
            }
        );
    };

    return callFunction;
}

const getPromise = () => {
    let resolve: (f: any) => any;
    let reject;
    const promise = new Promise<any>((res, rej) => {
        resolve = res;
        reject = rej;
    });
    // @ts-ignore
    if (!resolve) {
        console.log();
    }
    return {
        promise,
        // @ts-ignore
        resolve,
        reject
    }
}
declare global {
    var waitingVerifications: Record<string, { promise: Promise<any>, resolve: (f: any) => any, stage: PromptStages }>
    var waitingResponses: Record<string, { promise: Promise<any>, resolve: (f: any) => any, stage: PromptStages }>
}
export type GenerateNodeParams = { question: string, context: string, id: number | null };
if (!global.waitingVerifications) {
    global.waitingVerifications = {};
    global.waitingResponses = {};
}
/*
export const waitingVerifications: Record<string, { promise: Promise<any>, resolve: (f: any) => any, stage: PromptStages }> = {}
export const waitingResponses: Record<string, { promise: Promise<any>, resolve: (f: any) => any, stage: PromptStages }> = {}
*/
export const functionMap = {
    generateNode: async (params: GenerateNodeParams) => {
        const {question, context, id} = params;
        return await generateNode(question, context, id);
    },
    beginPipeline: async ({prompt}: { prompt: string }) => {
        const pipelineId = uuidv4()
        const responsePromise = getPromise();
        global.waitingResponses[pipelineId] = {
            promise: responsePromise.promise,
            resolve: responsePromise.resolve,
            stage: PromptStages.Verification
        }
        processPrompt(
            prompt,
            async (id: string, prompt: string, stage: PromptStages) => {
                const verificationPromise = getPromise();
                global.waitingVerifications[id] = {
                    promise: verificationPromise.promise,
                    resolve: verificationPromise.resolve,
                    stage: stage,
                };
                return await verificationPromise.promise;
            },
            async ({id, stage, ...other}) => {
                const promise = global.waitingResponses[id];
                if (!promise) {
                    throw new Error(`No response promise found for ${id}`);
                }
/*
                if (promise.stage !== stage) {
                    throw new Error(`Stage mismatch. Promise stage:${promise.stage}, Response Stage: ${stage}`);
                }
*/
                promise.resolve({
                    stage,
                    id,
                    ...other,
                });
            },
            pipelineId
        ).catch(e => {
            console.error(e);
        });

        return await global.waitingResponses[pipelineId].promise;
    },
    modifyVerificationPrompt: async ({id, prompt}: { id: string, prompt: string }) => {
        const waitingVerification = global.waitingVerifications[id];
        if (!waitingVerification) {
            throw new Error(`No verification promise found for ${id}`);
        }
/*
        if (waitingVerification.stage !== PromptStages.Verification) {
            throw new Error(`Stage mismatch.  Intended Stage: ${PromptStages.Verification} Waiting verification stage: ${waitingVerification.stage}`);
        }
*/
        waitingVerification.resolve(prompt);
        // Look up that specific pipeline and check that its in progress at
        // the correct stage before submitting
        const responsePromise = getPromise();
        global.waitingResponses[id] = {
            promise: responsePromise.promise,
            resolve: responsePromise.resolve,
            stage: PromptStages.Verification
        }
        return await responsePromise.promise;
    },
    modifyFixingPrompt: async ({id, prompt}: { id: string, prompt: string }) => {
        const waitingVerification = global.waitingVerifications[id];
        if (!waitingVerification) {
            throw new Error(`No verification promise found for ${id}`);
        }
/*
        if (waitingVerification.stage !== PromptStages.Fixing) {
            throw new Error(`Stage mismatch ${PromptStages.Fixing} ${waitingVerification.stage}`);
        }
*/
        waitingVerification.resolve(prompt);
        // Look up that specific pipeline and check that its in progress at
        // the correct stage before submitting
        const responsePromise = getPromise();
        global.waitingResponses[id] = {
            promise: responsePromise.promise,
            resolve: responsePromise.resolve,
            stage: PromptStages.Fixing
        }
        return await responsePromise.promise;
    }
};