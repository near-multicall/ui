import { WorkspaceEditor } from "./workspace-editor.ui";

export { WorkspaceEditor };

declare global {
    interface Window {
        EDITOR: WorkspaceEditor;
    }
}
