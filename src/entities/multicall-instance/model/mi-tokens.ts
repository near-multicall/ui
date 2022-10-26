import { useEffect, useState } from "react";

import { ArgsAccount } from "../../../shared/lib/args";
import { MulticallContract } from "../../../shared/lib/contracts/multicall";
import { Props } from "../../../shared/lib/props";

import { type MulticallInstanceEntity } from "../config";

export type MulticallInstanceTokensWhitelist = {
    data: MulticallContract["tokensWhitelist"] | null;
    error: Error | null;
    loading: boolean;
};

export class MulticallInstanceTokensModel {
    static whitelistFetchFx = async (
        controllerContractAddress: MulticallInstanceEntity.Dependencies["controllerContractAddress"],
        callback: (result: MulticallInstanceTokensWhitelist) => void
    ) =>
        await MulticallContract.instanceDataFetchFx(
            `${ArgsAccount.deconstructAddress(controllerContractAddress).name}.${MulticallContract.FACTORY_ADDRESS}`,

            (multicallInstanceData) =>
                callback(Props.evolve({ data: ({ tokensWhitelist }) => tokensWhitelist }, multicallInstanceData))
        );

    static useWhitelist = (
        controllerContractAddress: MulticallInstanceEntity.Dependencies["controllerContractAddress"]
    ) => {
        const [state, stateUpdate] = useState<MulticallInstanceTokensWhitelist>({
            data: null,
            error: null,
            loading: true,
        });

        useEffect(
            () => void MulticallInstanceTokensModel.whitelistFetchFx(controllerContractAddress, stateUpdate),
            [controllerContractAddress, stateUpdate]
        );

        return state;
    };
}
