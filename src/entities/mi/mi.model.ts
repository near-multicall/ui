import { Multicall } from "../../shared/lib/contracts/multicall";

export const MISchema: {
    data: Multicall;
    error: Error | null;
    loading: boolean;
} = {
    data: new Multicall(""),
    error: null,
    loading: true,
};
