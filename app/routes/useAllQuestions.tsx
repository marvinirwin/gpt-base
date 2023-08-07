import {TreeNode} from "~/treeUtils";
import {useMemo} from "react";

export function useAllQuestions(documentTree: TreeNode) {
    return useMemo(
        () => {
            function extractQuestions(node: TreeNode): string[] {
                const questionPattern = /{{ (.*?) }}/g;
                let match;
                const questions = [];
                while ((match = questionPattern.exec(node.answer)) !== null) {
                    questions.push(match[1]);
                }
                return questions;
            }

            return extractQuestions(documentTree);
        },
        [documentTree]
    );
}