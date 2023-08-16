import {getChatGPTResponse} from "~/ChatGPT";
import {ChatCompletionFunctions} from "openai";
import {v4 as uuidv4} from 'uuid'

const askLanguageModel = (
    prompt: string,
) => {
    return getChatGPTResponse<string>(
        prompt,
        [],
        [],
        []
    );
}
const askLanguageModelShape = <T>(
    prompt: string,
    returnFunctionShape: ChatCompletionFunctions,
    returnFunction: (v: any) => T
): Promise<T> => {
    return getChatGPTResponse<T>(
        prompt,
        [],
        [returnFunctionShape],
        [returnFunction]
    );
}
function evaluateCorrectness({correct, reason}: {correct: boolean, reason: string}) {
    return {
        correct,
        reason
    }
}

export enum PromptStages {
    Verification = "Verification",
    Fixing = "Fixing",
    Finished="Finished",
}

type GetPromptModifications = (id: string, prompt: string, stage: PromptStages) => Promise<string>;

export async function processPrompt(
    initialPrompt: string,
    getPromptModifications: GetPromptModifications,
    sendResponse: (v: any) => Promise<void>,
    id: string,
): Promise<string> {
    let result = await askLanguageModel(initialPrompt);
    let summaryPrompt = await askLanguageModel(`Summarize the following in less than 25 characters: ${initialPrompt}`);
    let verificationPrompt = await askLanguageModel(
        `The following is a request to a language model.  
        Can you respond with a prompt which will be used to verify that the language model completed the request in the prompt correctly?
        ${initialPrompt}`
    );
    await sendResponse({
        id,
        result,
        prompt: verificationPrompt,
        summary: summaryPrompt,
        stage: PromptStages.Fixing
    });
    verificationPrompt = await getPromptModifications(id, verificationPrompt, PromptStages.Verification);

    const verificationResult = await askLanguageModelShape<{ correct: boolean, reason: string }>(
        `
        The following is a criteria for completion of a request: "${verificationPrompt}".
        Does the following response to the request fulfill the criteria?
        ${result}
        `,
        {
            "name": "evaluateCorrectness",
            "description": "Evaluate the correctness of an operation and provide a reason",
            "parameters": {
                "type": "object",
                "properties": {
                    "correct": {
                        "type": "boolean",
                        "description": "Indicates whether the operation is correct"
                    },
                    "reason": {
                        "type": "string",
                        "description": "Explains why the operation is correct or incorrect"
                    }
                },
                "required": ["correct", "reason"]
            }
        },
        evaluateCorrectness
    );

    if (!verificationResult.correct) {
        let fixingPrompt = await askLanguageModel(result);
        await sendResponse({id, fixingPrompt, stage: PromptStages.Fixing});
        fixingPrompt = await getPromptModifications(id, fixingPrompt, PromptStages.Fixing);
        return processPrompt(fixingPrompt, getPromptModifications, sendResponse, id);
    }

    await sendResponse({id, result: result, stage: PromptStages.Finished});
    return result;
}