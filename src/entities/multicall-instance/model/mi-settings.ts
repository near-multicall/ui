import { createContext, useContext, useEffect, useState } from "react";

import { ArgsAccount } from "../../../shared/lib/args-old";
import { Multicall } from "../../../shared/lib/contracts/multicall";
import { MI } from "../module-context";

export class MISettingsModel {
    public static readonly data: {
        data: Multicall | null;
        error: Error | null;
        loading: boolean;
    } = {
        data: null,
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
        daoAddress: MI.Inputs["daoAddress"],
        callback: (result: typeof MISettingsModel.data) => void
    ) =>
        callback(
            await Multicall.init(
                `${ArgsAccount.deconstructAddress(daoAddress).name}.${Multicall.FACTORY_ADDRESS}`
            ).then((multicallInstance) => ({
                data: multicallInstance.ready ? multicallInstance : null,
                error: multicallInstance.ready ? null : new Error("Unable to connect to Multicall Instance"),
                loading: false,
            }))
        );

    /**
     * For context provider usage only.
     */
    public static readonly useData = (daoAddress: MI.Inputs["daoAddress"]) => {
        const [state, stateUpdate] = useState<typeof MISettingsModel.data>(MISettingsModel.data);

        useEffect(() => void MISettingsModel.dataFetchFx(daoAddress, stateUpdate), [daoAddress, stateUpdate]);

        return state;
    };

    public static readonly Context = createContext(MISettingsModel.data);
    public static readonly useContext = () => useContext(MISettingsModel.Context);
}
