import React from 'react';
import {type ActionArgs} from '@remix-run/node';
import {useActionData, useNavigation} from '@remix-run/react';
import {functionMap} from "~/backendFns";
import {PipeLineComponent} from '~/components/PipelineComponent';

/**
 * API call executed server side
 */
export async function action({request}: ActionArgs): Promise<any> {
    const body = await request.formData();
    const functionName = body.get('functionName') as string;
    const functionParameters = JSON.parse(body.get('functionParameters') as string);

    const functionToCall = functionMap[functionName as keyof typeof functionMap];
    if (functionToCall) {
        try {
            return (await functionToCall(functionParameters) || null);
        } catch (error: any) {
            return {
                error: error
            };
        }
    } else {
        console.error(`Function ${functionName} not found`)
        return null;
    }
    return null;
}


const initialPrompt = `
Can you write me a Typescript NodeJs discord bot which allows a user to set a 
goal for a date, and then insults them if they have not completed it by a date?

When a user submits a goal, the goal is given a unique id (unix time in ms) and returned to the user.

Then the user must submit a post with the goal's ID, which other users will vote (their votes also must also contain the id of that goal) sufficient or insufficient.

If a goal is not completed by the intended date then announce it.

All business logic should be isolated in a state machine type module to allow for independent testing without discord.
`
export default function IndexPage() {
    const data = useActionData<typeof action>();
    const navigation = useNavigation();
    const isSubmitting = navigation.state === 'submitting';
    return (
/*
        <div>
*/
/*
            <AskCurlyBraceQuestionToGenerateNode
                isSubmitting={isSubmitting}
                data={data}
            />
*/
            <PipeLineComponent
                initialPromptProp={initialPrompt}
            />
/*
        </div>
*/
    )
}