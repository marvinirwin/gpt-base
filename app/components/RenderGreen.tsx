import React from 'react';
import ReactMarkdown from "react-markdown";

function RenderGreen({input}:{input: string}) {
    // Split the string by double curly braces, including the braces in the resulting parts
    const parts = input.split(/(\{\{.*?\}\})/);

    return (
        <span>
            {parts.map((part, i) => {
                // If part starts with {{ and ends with }}, render it in green
                if (/^\{\{.*\}\}$/.test(part)) {
                    return <span style={{color: 'green'}}><ReactMarkdown key={i}>{part}</ReactMarkdown></span>;
                }
                // Otherwise, render it normally
                return <ReactMarkdown key={i}>{part}</ReactMarkdown>;
            })}
        </span>
    );
}

export default RenderGreen;