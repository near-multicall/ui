import { useEffect, useState } from "react";

import { ArgsAccount } from "../../../shared/lib/args";
import { MulticallContract } from "../../../shared/lib/contracts/multicall";
import { Props } from "../../../shared/lib/props";

import { type MulticallEntity } from "../config";

export type MulticallTokensWhitelist = {
    data: MulticallContract["tokensWhitelist"] | null;
    error: Error | null;
    loading: boolean;
};

export class MulticallTokensModel {
    static whitelistFetchFx = async (
        ownerContractAddress: MulticallEntity.Dependencies["ownerContractAddress"],
        callback: (result: MulticallTokensWhitelist) => void
    ) =>
        await MulticallContract.instanceDataFetchFx(
            `${ArgsAccount.deconstructAddress(ownerContractAddress).name}.${MulticallContract.FACTORY_ADDRESS}`,

            (multicallInstanceData) =>
                callback(Props.evolve({ data: ({ tokensWhitelist }) => tokensWhitelist }, multicallInstanceData))
        );

    static useWhitelist = (ownerContractAddress: MulticallEntity.Dependencies["ownerContractAddress"]) => {
        const [state, stateUpdate] = useState<MulticallTokensWhitelist>({
            data: null,
            error: null,
            loading: true,
        });

        useEffect(
            () => void MulticallTokensModel.whitelistFetchFx(ownerContractAddress, stateUpdate),
            [ownerContractAddress, stateUpdate]
        );

        return state;
    };
}
