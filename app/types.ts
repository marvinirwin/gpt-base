import {TreeNode} from "~/components/Tree";

export type Role = 'user' | 'system' | 'assistant';
export type ReturnedDataProps = {
    newNode: TreeNode
} | {
    error: string;
}