import { createContext, useContext, useEffect, useState } from "react";

import { ArgsAccount } from "../../../shared/lib/args-old";
import { Multicall } from "../../../shared/lib/contracts/multicall";
import { Entity } from "../module-context";

export class MIPropertiesModel {
    public static readonly data: {
        data: Multicall;
        error: Error | null;
        loading: boolean;
    } = {
        data: new Multicall(""),
        error: null,
        loading: true,
    };

    /**
     * Calls the given callback with a result of multicall contract instantiation,
     * represented as stateful response.
     *
     * @param daoAddress DAO contract address
     * @param callback Stateful data fetch callback
     */
    private static readonly dataFetchFx = async (
        daoAddress: Entity.Inputs["daoAddress"],
        callback: (result: typeof MIPropertiesModel.data) => void
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

    /**
     * For context provider usage only.
     */
    public static readonly useData = (daoAddress: Entity.Inputs["daoAddress"]) => {
        const [state, stateUpdate] = useState<typeof MIPropertiesModel.data>(MIPropertiesModel.data);

        useEffect(() => void MIPropertiesModel.dataFetchFx(daoAddress, stateUpdate), [daoAddress, stateUpdate]);

        return state;
    };

    public static readonly Context = createContext(MIPropertiesModel.data);
    public static readonly useContext = () => useContext(MIPropertiesModel.Context);
}