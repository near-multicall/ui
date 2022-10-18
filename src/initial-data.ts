export const initialData = {
    tasks: {
        "task-i1": { id: "task-i1", addr: "", func: "" },
        "task-i2": { id: "task-i2", addr: "near", func: "ft_transfer" },
        "task-i3": { id: "task-i3", addr: "multicall", func: "near_transfer" },
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
            taskIds: ["task-i1", "task-i2", "task-i3"],
        },
    },
    columnOrder: ["column-0"],
};
