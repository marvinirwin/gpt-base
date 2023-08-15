import {readFile, writeFile} from 'fs/promises';
import { OpenAIApi, Configuration, ChatCompletionRequestMessage, ChatCompletionFunctions } from 'openai'; // Assuming these are the correct imports


const cacheFilename = 'responseCache.json';
let cache: Record<string, any> = {};
let cacheLoaded = false;
export async function getChatGPTResponse<T>(
    prompt: string,
    messages: ChatCompletionRequestMessage[],
    functions: ChatCompletionFunctions[],
    callbacks: ((params: any) => any)[]
): Promise<T> {
    if (!cacheLoaded) {
        try {
            cache = JSON.parse(await readFile(cacheFilename, 'utf-8'));
        } catch(e) {
            console.error(`Couldn't read cache`);
            cache = {};
        }
    }
    cacheLoaded = true;
    const cacheKey = `responseCache.${prompt + JSON.stringify(functions) + JSON.stringify(messages)}`;
    const cachedResponse = cache[cacheKey] as T;

    if (cachedResponse) {
        return cachedResponse;
    }

    let response = '';

    const sendUserMessage = async (input: string) => {
        const requestMessage: ChatCompletionRequestMessage = {
            role: 'user',
            content: input,
        };
        const GPTAPIKey = process.env.OPENAI_API_KEY;
        if (!GPTAPIKey){
            console.error("'OPENAI_API_KEY' not found within process.env.");
            return;
        }
        const configuration = new Configuration({
            apiKey: GPTAPIKey,
        });
        const openai = new OpenAIApi(configuration);

        try {
            const GPTModel = process.env.GPT_MODEL || "gpt-4-0613";
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
                    throw new Error(`what the fuck ChatGPT function ${function_name} not found`);
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

    cache[cacheKey] = response;
    // Cache the response
    await writeFile(cacheFilename, JSON.stringify(cache));

    return response as unknown as T;
}