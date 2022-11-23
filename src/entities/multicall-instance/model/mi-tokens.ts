import { useEffect, useState } from "react";

import { ArgsAccount } from "../../../shared/lib/args-old";
import { Multicall } from "../../../shared/lib/contracts/multicall";
import { Props } from "../../../shared/lib/props";
import { type MulticallInstanceEntity } from "../config";

import { MulticallInstanceSettingsModel } from "./mi-settings";

export type MulticallInstanceTokensWhitelist = {
    data: Multicall["tokensWhitelist"] | null;
    error: Error | null;
    loading: boolean;
};

export class MulticallInstanceTokensModel {
    static whitelistFetchFx = async (
        daoAddress: MulticallInstanceEntity.Inputs["daoAddress"],
        callback: (result: MulticallInstanceTokensWhitelist) => void
    ) =>
        await MulticallInstanceSettingsModel.fetchFx(
            `${ArgsAccount.deconstructAddress(daoAddress).name}.${Multicall.FACTORY_ADDRESS}`,

            (multicallInstanceData) =>
                callback(Props.evolve({ data: ({ tokensWhitelist }) => tokensWhitelist }, multicallInstanceData))
        );

    static useWhitelist = (daoAddress: MulticallInstanceEntity.Inputs["daoAddress"]) => {
        const [state, stateUpdate] = useState<MulticallInstanceTokensWhitelist>({
            data: null,
            error: null,
            loading: true,
        });

        useEffect(
            () => void MulticallInstanceTokensModel.whitelistFetchFx(daoAddress, stateUpdate),
            [daoAddress, stateUpdate]
        );

        return state;
    };
}
