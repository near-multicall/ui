import { createContext, useEffect, useMemo, useState } from "react";

import { Multicall } from "../../shared/lib/contracts/multicall";
import { SputnikDAO } from "../../shared/lib/contracts/sputnik-dao";

import { MISchema } from "./mi.model";

export interface IMIService {
    daoAddress: SputnikDAO["address"];
}

export class MIService {
    public static readonly Context = createContext(MISchema);

    /**
     * Calls the given callback with a result of multicall contract instantiation,
     * represented as stateful response.
     *
     * @param daoAddress DAO contract address
     * @param callback Stateful data fetch callback
     */
    private static readonly propertiesFetch = async (
        { daoAddress }: IMIService,
        callback: (result: typeof MISchema) => void
    ) =>
        callback(
            await Multicall.init(Multicall.getInstanceAddress(daoAddress)).then((multicallInstance) => ({
                data: multicallInstance,
                error: multicallInstance.ready ? null : new Error("Unable to connect to Multicall Instance"),
                loading: !multicallInstance.ready,
            }))
        );

    public static readonly usePropertiesState = (inputs: IMIService) => {
        const [state, stateUpdate] = useState(MISchema);

        useEffect(() => {
            stateUpdate(MISchema);
            void MIService.propertiesFetch(inputs, stateUpdate);
        }, [...Object.values(inputs), stateUpdate]);

        useEffect(() => {
            state.error instanceof Error && void console.error(state.error);
        }, [state.error]);

        return useMemo(() => state, [...Object.values(inputs), ...Object.values(state)]);
    };
}
