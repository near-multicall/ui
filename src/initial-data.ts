export const initialData = {
    tasks: {
        "task-i1": { id: "task-i1", addr: "", func: "" },
        "task-i2": { id: "task-i2", addr: "near", func: "ft_transfer" },
        "task-i3": { id: "task-i3", addr: "near", func: "ft_transfer_call" },
        "task-i4": { id: "task-i4", addr: "near", func: "mft_transfer" },
        "task-i5": { id: "task-i5", addr: "near", func: "mft_transfer_call" },
        "task-i6": { id: "task-i6", addr: "near", func: "deposit_and_stake" },
        "task-i7": { id: "task-i7", addr: "near", func: "unstake" },
        "task-i8": { id: "task-i8", addr: "near", func: "withdraw" },
        "task-i9": { id: "task-i9", addr: "near", func: "storage_withdraw" },
        "task-i10": { id: "task-i10", addr: "near", func: "storage_unregister" },
        "task-i11": { id: "task-i11", addr: "near", func: "storage_deposit" },
        "task-i12": { id: "task-i12", addr: "multicall", func: "near_transfer" },
        "task-i13": { id: "task-i13", addr: "mintbase", func: "create_store" },
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
            taskIds: [
                "task-i1",
                "task-i2",
                "task-i3",
                "task-i4",
                "task-i5",
                "task-i6",
                "task-i7",
                "task-i8",
                "task-i9",
                "task-i10",
                "task-i11",
                "task-i12",
                "task-i13",
            ],
        },
    },
    columnOrder: ["column-0"],
};
