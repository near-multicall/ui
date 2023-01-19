import AppPageUI from "./app-page.ui";

declare global {
    interface Window {
        LAYOUT: AppPageUI;
    }
}
