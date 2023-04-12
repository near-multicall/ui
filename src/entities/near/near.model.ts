export type NEARModel = {
    balances: {
        account: string;
        multicallInstance: string;
        total: string;
    };
};

export const NEARSchema: {
    balances: {
        data: null | NEARModel["balances"];
        error: Error | null;
        loading: boolean;
    };
} = {
    balances: {
        data: null,
        error: null,
        loading: true,
    },
};
