import {TreeNode} from "~/treeUtils";

export type Role = 'user' | 'system' | 'assistant';
export type ReturnedDataProps = {
    newNode: TreeNode
} | {
    error: string;
}