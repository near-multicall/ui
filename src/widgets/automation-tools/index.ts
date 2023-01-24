import { AutomationToolsUI } from "./automation-tools.ui";

export { AutomationToolsUI as AutomationTools };

declare global {
    interface Window {
        MENU: AutomationToolsUI;
    }
}
