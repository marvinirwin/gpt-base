import * as fs from 'fs';
import { promisify } from 'util';
import { OpenAIApi, Configuration, ChatCompletionRequestMessage, ChatCompletionFunctions } from 'openai'; // Assuming these are the correct imports

const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);

export async function getChatGPTResponse<T>(
    prompt: string,
    messages: ChatCompletionRequestMessage[],
    functions: ChatCompletionFunctions[],
    callbacks: ((params: any) => any)[]
): Promise<T> {
    const cacheKey = `responseCache.${prompt + JSON.stringify(functions) + JSON.stringify(messages)}`;
    let cachedResponse: T | null = null;
    try {
        const cacheContent = await readFileAsync(cacheKey, 'utf8');
        cachedResponse = JSON.parse(cacheContent) as T;
    } catch (e) {
        // Cache miss, do nothing
    }

    if (cachedResponse) {
        return cachedResponse;
    }

    let response = '';

    const sendUserMessage = async (input: string) => {
        const requestMessage: ChatCompletionRequestMessage = {
            role: 'user',
            content: input,
        };
        const GPTAPIKey = process.env.GPTAPIKey;
        if (!GPTAPIKey){
            console.error("'GPTAPIKey' not found within process.env.");
            return;
        }
        const configuration = new Configuration({
            apiKey: GPTAPIKey,
        });
        const openai = new OpenAIApi(configuration);

        try {
            const GPTModel = process.env.GOTModel || "gpt-4-0613";
            const completion = await openai.createChatCompletion({
                model: GPTModel,
                messages: messages.concat(requestMessage),
                functions: functions.length ? functions : undefined,
                function_call: functions.length ? 'auto' : undefined
            });

            const responseMessage = completion.data.choices[0].message;
            let responseContent = responseMessage?.content;
            if (responseMessage?.function_call) {
                const function_name = responseMessage?.function_call?.name;
                const foundFunction = callbacks.find(callback => callback.name === function_name);
                if (!foundFunction) {
                    throw new Error(`ChatGPT function ${function_name} not found`);
                }
                responseContent = foundFunction(
                    JSON.parse(responseMessage?.function_call?.arguments || "{}")
                );
                console.log(responseContent)
            }


            if (responseMessage && responseContent) {
                response = responseContent,
                    messages.push({
                        role: responseMessage.role,
                        function_call: responseMessage.function_call,
                        content: responseMessage.content
                    });
            }
        } catch (error) {
            throw error;
        }
    };

    await sendUserMessage(prompt);

    // Cache the response
    await writeFileAsync(cacheKey, JSON.stringify(response));

    return response as unknown as T;
}