import { WorkflowEditorMenu } from "./workflow-editor.ui";

export { WorkflowEditorMenu };

declare global {
    interface Window {
        MENU: WorkflowEditorMenu;
    }
}
