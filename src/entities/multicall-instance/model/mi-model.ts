import { createContext, useContext, useEffect, useState } from "react";

import { ArgsAccount } from "../../../shared/lib/args-old";
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

    public static readonly PropertiesContext = createContext(MIModel.properties);
    public static readonly useProperties = () => useContext(MIModel.PropertiesContext);

    /**
     * Calls the given callback with a result of multicall contract instantiation,
     * represented as stateful response.
     *
     * @param daoAddress DAO contract address
     * @param callback Stateful data fetch callback
     */
    private static readonly propertiesFetch = async (
        daoAddress: MIModelInputs["daoAddress"],
        callback: (result: typeof MIModel.properties) => void
    ) =>
        callback(
            await Multicall.init(
                `${ArgsAccount.deconstructAddress(daoAddress).name}.${Multicall.FACTORY_ADDRESS}`
            ).then((multicallInstance) => ({
                data: multicallInstance,
                error: multicallInstance.ready ? null : new Error("Unable to connect to Multicall Instance"),
                loading: false,
            }))
        );

    public static readonly usePropertiesState = (daoAddress: MIModelInputs["daoAddress"]) => {
        const [state, stateUpdate] = useState<typeof MIModel.properties>(MIModel.properties);

        useEffect(() => void MIModel.propertiesFetch(daoAddress, stateUpdate), [daoAddress, stateUpdate]);

        return state;
    };
}
