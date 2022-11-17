export const initialData = {
    tasks: {
        /**
         * Custom task
         */
        "task-i1": { id: "task-i1", family: "", func: "" },

        "task-i2": { id: "task-i2", family: "near", func: "ft_transfer" },
        "task-i3": { id: "task-i3", family: "near", func: "ft_transfer_call" },
        "task-i4": { id: "task-i4", family: "near", func: "nft_transfer" },
        "task-i5": { id: "task-i5", family: "near", func: "nft_transfer_call" },
        "task-i6": { id: "task-i6", family: "near", func: "nft_approve" },
        "task-i7": { id: "task-i7", family: "near", func: "nft_revoke" },
        "task-i8": { id: "task-i8", family: "near", func: "mft_transfer" },
        "task-i9": { id: "task-i9", family: "near", func: "mft_transfer_call" },
        "task-i10": { id: "task-i10", family: "near", func: "deposit_and_stake" },
        "task-i11": { id: "task-i11", family: "near", func: "unstake" },
        "task-i12": { id: "task-i12", family: "near", func: "withdraw" },
        "task-i13": { id: "task-i13", family: "near", func: "storage_withdraw" },
        "task-i14": { id: "task-i14", family: "near", func: "storage_unregister" },
        "task-i15": { id: "task-i15", family: "near", func: "storage_deposit" },

        "task-i16": { id: "task-i16", family: "multicall", func: "near_transfer" },

        "task-i17": { id: "task-i17", family: "mintbase", func: "create_store" },
        "task-i18": { id: "task-i18", family: "mintbase", func: "transfer_store_ownership" },
        "task-i19": { id: "task-i19", family: "mintbase", func: "grant_minter" },
        "task-i20": { id: "task-i20", family: "mintbase", func: "revoke_minter" },

        "task-i21": { id: "task-i21", family: "ref-finance", func: "xref-unstake" },
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
                "task-i14",
                "task-i15",
                "task-i16",
                "task-i17",
                "task-i18",
                "task-i19",
                "task-i20",
                "task-i21",
            ],
        },
    },

    columnOrder: ["column-0"],
};
