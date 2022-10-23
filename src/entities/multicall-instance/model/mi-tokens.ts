import { useEffect, useState } from "react";

import { ArgsAccount } from "../../../shared/lib/args";
import { MulticallContract } from "../../../shared/lib/contracts/multicall";
import { Props } from "../../../shared/lib/props";

import { type MIEntity } from "../config";

export type MITokensWhitelist = {
    data: MulticallContract["tokensWhitelist"] | null;
    error: Error | null;
    loading: boolean;
};

export class MITokensModel {
    static whitelistFetchFx = async (
        controllerContractAddress: MIEntity.Dependencies["controllerContractAddress"],
        callback: (result: MITokensWhitelist) => void
    ) =>
        await MulticallContract.instanceDataFetchFx(
            `${ArgsAccount.deconstructAddress(controllerContractAddress).name}.${MulticallContract.FACTORY_ADDRESS}`,

            (multicallInstanceData) =>
                callback(Props.evolve({ data: ({ tokensWhitelist }) => tokensWhitelist }, multicallInstanceData))
        );

    static useWhitelist = (controllerContractAddress: MIEntity.Dependencies["controllerContractAddress"]) => {
        const [state, stateUpdate] = useState<MITokensWhitelist>({
            data: null,
            error: null,
            loading: true,
        });

        useEffect(
            () => void MITokensModel.whitelistFetchFx(controllerContractAddress, stateUpdate),
            [controllerContractAddress, stateUpdate]
        );

        return state;
    };
}
