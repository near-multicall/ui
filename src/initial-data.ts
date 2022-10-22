export const initialData = {
    tasks: {
        "task-i1": { id: "task-i1", addr: "", func: "" },
        "task-i2": { id: "task-i2", addr: "near", func: "ft_transfer" },
        "task-i3": { id: "task-i3", addr: "multicall", func: "near_transfer" },
        "task-i5": { id: "task-i5", addr: "near", func: "storage_withdraw" },
        "task-i6": { id: "task-i6", addr: "near", func: "storage_unregister" },
    },
    columns: {
        "column-0": {
            id: "column-0",
            title: "Drag here",
            taskIds: [],
        },
        menu: {
            id: "menu",
            title: "Infinite Column",
            taskIds: ["task-i1", "task-i2", "task-i3", "task-i5", "task-i6"],
        },
    },
    columnOrder: ["column-0"],
};
