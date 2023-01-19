import { FungibleToken } from "../../shared/lib/standards/fungibleToken";

export type FTModel = {
    balances: Pick<FungibleToken, "metadata"> & {
        account: string;
        multicallInstance: string;
        total: string;
    };
};

export const FTSchema: {
    balances: {
        data: null | FTModel["balances"][];
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
