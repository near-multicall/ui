import { EditTaskUI } from "./edit-task.ui";

export class EditTask {
    public static readonly UI = EditTaskUI;
}

declare global {
    interface Window {
        EDITOR: EditTaskUI;
    }
}
