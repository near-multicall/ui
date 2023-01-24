import { Task } from "./task";
import { TaskTemplates } from "./task.ui";

export { Task, TaskTemplates };

type TaskInfo = {
    formData: object;
    showArgs: boolean;
    isEdited: boolean;
    options: object;
};

type TaskCopy = {
    from: string;
    to: string;
    payload?: Omit<TaskInfo, "isEdited">;
};

declare global {
    interface Window {
        // Temporary storage for moving and cloning cards
        TEMP: TaskInfo | null;
        COPY: TaskCopy | null;

        // List of all mounted tasks
        TASKS: Array<Task>;
    }
}
