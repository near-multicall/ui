import { Workspace } from "./workspace.ui";

export { Workspace };

declare global {
    interface Window {
        LAYOUT: Workspace;
    }
}
