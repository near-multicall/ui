import { WorkspaceMenu } from "./workspace-menu.ui";

export { WorkspaceMenu };

declare global {
    interface Window {
        MENU: WorkspaceMenu;
    }
}
