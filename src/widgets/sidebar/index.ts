import { SidebarUI } from "./sidebar.ui";

export { SidebarUI as Sidebar };

declare global {
    interface Window {
        SIDEBAR: SidebarUI;
    }
}
