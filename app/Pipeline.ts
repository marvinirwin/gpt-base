// Assuming askLanguageModel, getPromptModifications are defined somewhere else
// and they both return a Promise<string>
import {queryChatGPT} from './treeUtils';
import {getChatGPTResponse} from "~/ChatGPT";
import {ChatCompletionFunctions} from "openai";

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

async function processPrompt(
    initialPrompt: string,
    getPromptModifications: (prompt: string) => Promise<string>
): Promise<string> {
    let initialResult = await askLanguageModel(initialPrompt);
    let verificationPrompt = await askLanguageModel(
        `The following is a request to a language model.  
        Can you respond with a prompt which will be used to verify that the language model completed the request in the prompt correctly?
        ${initialPrompt}
        `
    );
    verificationPrompt = await getPromptModifications(verificationPrompt);


    let verificationResult = await askLanguageModelShape<{ correct: boolean, reason: string }>(
        `
        The following is a criteria for completion of a request: "${verificationPrompt}".
        Does the following response to the request fulfill the criteria?
        ${initialResult}
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
        ({correct, reason}) => {
            return {
                correct,
                reason
            }
        }
    );

    if (!verificationResult.correct) {
        let fixingPrompt = await askLanguageModel(initialResult);
        fixingPrompt = await getPromptModifications(fixingPrompt);

        return processPrompt(fixingPrompt, getPromptModifications);
    }

    return initialResult;
}