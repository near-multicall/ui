import { TaskParams } from "./task.params";
import { TaskCard } from "./ui/task.card";
import { TaskCardsList } from "./ui/task.cards-list";
import { TaskSequenceColumn } from "./ui/task.sequence";

export class Task extends TaskParams {
    public static readonly Card = TaskCard;
    public static readonly CardsList = TaskCardsList;
    public static readonly SequenceColumn = TaskSequenceColumn;
}

type TaskCardInfo = {
    formData: object;
    showArgs: boolean;
    isEdited: boolean;
    options: object;
};

type TaskCardCopy = {
    from: string;
    to: string;
    payload?: Omit<TaskCardInfo, "isEdited">;
};

declare global {
    interface Window {
        // Temporary storage for moving and cloning cards
        TEMP: TaskCardInfo | null;
        COPY: TaskCardCopy | null;

        // List of all mounted tasks
        TASKS: Array<TaskCard>;
    }
}
