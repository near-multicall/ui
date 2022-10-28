export const initialData = {
    tasks: {
        "task-i1": { id: "task-i1", family: "", func: "" },
        "task-i2": { id: "task-i2", family: "near", func: "ft_transfer" },
        "task-i3": { id: "task-i3", family: "multicall", func: "near_transfer" },
        "task-i4": { id: "task-i4", family: "mintbase", func: "create_store" },
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
            taskIds: ["task-i1", "task-i2", "task-i3", "task-i4"],
        },
    },
    columnOrder: ["column-0"],
};
