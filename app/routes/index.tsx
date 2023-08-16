import React, { useState } from 'react';
import {type ActionArgs} from '@remix-run/node';
import {useActionData, useNavigation} from '@remix-run/react';
import {functionMap} from "~/backendFns";
import {PipeLineComponent} from '~/components/PipelineComponent';
import {useLocalStorageState, PipelineState} from "~/components/useLocalStorageState";
import {useUrlSelection} from "~/components/useUrlItem";
import {LibraryList} from "~/components/LibraryList";

/**
 * API call executed server side
 */
export async function action({request}: ActionArgs): Promise<any> {
    const body = await request.formData();
    const functionName = body.get('functionName') as string;
    const functionParameters = JSON.parse(body.get('functionParameters') as string);

    const functionToCall = functionMap[functionName as keyof typeof functionMap];
    console.log(functionName, functionParameters.id);
    if (functionToCall) {
        try {
            return (await functionToCall(functionParameters) || null);
        } catch (error: any) {
            return {
                error: error.message
            };
        }
    } else {
        console.error(`Function ${functionName} not found`)
        return null;
    }
    return null;
}


const initialPrompt = `Can you write me a Typescript NodeJs discord bot which allows a user to set a 
goal for a date, and then insults them if they have not completed it by a date?

When a user submits a goal, the goal is given a unique id (unix time in ms) and returned to the user.

Then the user must submit a post with the goal's ID, which other users will vote (their votes also must also contain the id of that goal) sufficient or insufficient.

If a goal is not completed by the intended date then announce it.

All business logic should be isolated in a state machine type module to allow for independent testing without discord.
`
export default function IndexPage() {
    const data = useActionData<typeof action>();
    const navigation = useNavigation();
    const [pipelines, setPipelines] = useLocalStorageState('pipelines', [] as any[]);
    const [newPrompt, setNewPrompt] = useState<string>("")
    const {
        selectedId: selectedPipelineId,
        selectItem: selectPipeline,
    } = useUrlSelection();
    const selectedPipeline = pipelines.find(pipeline => pipeline.uuid === selectedPipelineId);
    const handleKeyDown = (event: React.KeyboardEvent) => {
        if (event.ctrlKey && event.key === 'Enter') {
            const newPipeline: PipelineState = { 
                prompt: newPrompt,
                uuid: Math.random().toString(),
            };
            setPipelines(currentPipelines => [...currentPipelines, newPipeline]);
            // TODO fix this, right now the id is empty
            // If we press enter twice, then it wont work
            selectPipeline(newPipeline.uuid);
        }
    };
    return (
        <div className="grid grid-cols-12 gap-4">
            <LibraryList
                onClick={i => selectPipeline(i)}
                items={pipelines.map(pipeline => ({id: pipeline.uuid, label: pipeline.summary || pipeline.prompt}))}
                selectedItem={selectedPipeline ? {id: selectedPipeline.uuid, label: selectedPipeline.summary || selectedPipeline.prompt} : null}
            />
            {
                selectedPipeline ?
                    <PipeLineComponent
                        initialPromptProp={selectedPipeline.prompt}
                        resultProp={selectedPipeline.result}
                        pipelineId={selectedPipeline.id}
                        verificationPromptProp={selectedPipeline.verificationPrompt}
                        fixingPromptProp={selectedPipeline.fixingPrompt}
                        pipelineUuid={selectedPipeline.uuid}
                        onPipelineStateChanged={(updatedPipeline: PipelineState) => {
                            const index = pipelines.findIndex(pipeline => pipeline.uuid === updatedPipeline.uuid);
                            if (index !== -1) {
                                setPipelines([
                                    ...pipelines.slice(0, index),
                                    updatedPipeline,
                                    ...pipelines.slice(index + 1)
                                ]);
                            }
                        }}
                        summaryProp={selectedPipeline.summary}
                    /> :
                    <label className="mb-2 col-span-9">
                        <span className="text-sm font-medium text-gray-700">New Prompt:</span>
                        <textarea
                            className="mt-1 p-2 w-full h-20 border rounded-md"
                            value={newPrompt}
                            onChange={(event) => setNewPrompt(event.target.value)}
                            onKeyDown={(event) => handleKeyDown(event)}
                        />
                    </label>
            }
        </div>
        /*
                <div>
        */
        /*
                    <AskCurlyBraceQuestionToGenerateNode
                        isSubmitting={isSubmitting}
                        data={data}
                    />
        */
        /*
                </div>
        */
    )
}