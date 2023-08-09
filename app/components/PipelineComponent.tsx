import React, { useState, useEffect, KeyboardEvent } from 'react';

type VerificationResult = {
    correct: boolean;
    reason: string;
};

type MyComponentProps = {
    initialPrompt: string;
    vertificationPrompt?: string;
    onVertificationPromptEdited?: (newPrompt: string) => void;
    fixingPrompt?: string;
    onFixingPromptEdited?: (newPrompt: string) => void;
    loadingString?: string;
};

const PipeLineComponent: React.FC<MyComponentProps> = ({
                                                     initialPrompt,
                                                     vertificationPrompt = '',
                                                     onVertificationPromptEdited,
                                                     fixingPrompt = '',
                                                     onFixingPromptEdited,
                                                     loadingString = '',
                                                 }) => {
    const [verificationPromptState, setVerificationPromptState] = useState(
        vertificationPrompt
    );
    const [fixingPromptState, setFixingPromptState] = useState(fixingPrompt);

    useEffect(() => {
        setVerificationPromptState(vertificationPrompt);
        setFixingPromptState(fixingPrompt);
    }, [vertificationPrompt, fixingPrompt]);

    const handleKeyDown = (
        event: KeyboardEvent<HTMLTextAreaElement>,
        callback?: (newValue: string) => void
    ) => {
        if (event.key === 'Enter' && event.ctrlKey) {
            callback && callback((event.target as HTMLTextAreaElement).value);
        }
    };

    return (
        <div>
            <div>{loadingString}</div>
            <label>
                Initial Prompt:
                <textarea readOnly value={initialPrompt} />
            </label>
            <label>
                Verification Prompt:
                <textarea
                    value={verificationPromptState}
                    onChange={(event) =>
                        setVerificationPromptState(event.target.value)
                    }
                    onKeyDown={(event) =>
                        handleKeyDown(event, onVertificationPromptEdited)
                    }
                />
            </label>
            <label>
                Fixing Prompt:
                <textarea
                    value={fixingPromptState}
                    onChange={(event) => setFixingPromptState(event.target.value)}
                    onKeyDown={(event) => handleKeyDown(event, onFixingPromptEdited)}
                />
            </label>
        </div>
    );
};
