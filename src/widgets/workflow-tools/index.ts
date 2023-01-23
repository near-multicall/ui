import { WorkflowTools } from "./workflow-tools.ui";

export { WorkflowTools };

declare global {
    interface Window {
        MENU: WorkflowTools;
    }
}
