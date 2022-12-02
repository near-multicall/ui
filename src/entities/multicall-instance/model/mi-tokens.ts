import { useEffect, useState } from "react";

import { ArgsAccount } from "../../../shared/lib/args-old";
import { Multicall } from "../../../shared/lib/contracts/multicall";
import { Props } from "../../../shared/lib/props";
import { MI } from "../module-context";

import { MIInfoModel } from "./mi-settings";

export type MITokenWhitelist = {
    data: Multicall["tokensWhitelist"] | null;
    error: Error | null;
    loading: boolean;
};

export class MITokensModel {
    static whitelistFetchFx = async (
        daoAddress: MI.Inputs["daoAddress"],
        callback: (result: MITokenWhitelist) => void
    ) =>
        await MIInfoModel.dataFetchFx(
            `${ArgsAccount.deconstructAddress(daoAddress).name}.${Multicall.FACTORY_ADDRESS}`,

            (multicallInstanceData) =>
                callback(Props.evolve({ data: ({ tokensWhitelist }) => tokensWhitelist }, multicallInstanceData))
        );

    static useWhitelist = (daoAddress: MI.Inputs["daoAddress"]) => {
        const [state, stateUpdate] = useState<MITokenWhitelist>({
            data: null,
            error: null,
            loading: true,
        });

        useEffect(() => void MITokensModel.whitelistFetchFx(daoAddress, stateUpdate), [daoAddress, stateUpdate]);

        return state;
    };
}
