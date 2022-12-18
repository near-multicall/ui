import { createContext, useEffect, useState } from "react";

import { Multicall } from "../../../shared/lib/contracts/multicall";
import { SputnikDAO } from "../../../shared/lib/contracts/sputnik-dao";

export interface MIModelInputs {
    daoAddress: SputnikDAO["address"];
}

export class MIModel {
    public static readonly properties: {
        data: Multicall;
        error: Error | null;
        loading: boolean;
    } = {
        data: new Multicall(""),
        error: null,
        loading: true,
    };

    public static readonly Context = createContext(MIModel.properties);

    /**
     * Calls the given callback with a result of multicall contract instantiation,
     * represented as stateful response.
     *
     * @param daoAddress DAO contract address
     * @param callback Stateful data fetch callback
     */
    private static readonly propertiesFetch = async (
        { daoAddress }: MIModelInputs,
        callback: (result: typeof MIModel.properties) => void
    ) =>
        callback(
            await Multicall.init(Multicall.getInstanceAddress(daoAddress)).then((multicallInstance) => ({
                data: multicallInstance,
                error: multicallInstance.ready ? null : new Error("Unable to connect to Multicall Instance"),
                loading: false,
            }))
        );

    public static readonly usePropertiesState = (inputs: MIModelInputs) => {
        const [state, stateUpdate] = useState(MIModel.properties);

        useEffect(() => void MIModel.propertiesFetch(inputs, stateUpdate), [inputs, stateUpdate]);

        return state;
    };
}
