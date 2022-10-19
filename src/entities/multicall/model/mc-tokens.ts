import { useEffect, useState } from "react";

import { ArgsAccount } from "../../../shared/lib/args";
import { MulticallContract } from "../../../shared/lib/contracts/multicall";
import { Props } from "../../../shared/lib/props";

import { type MulticallEntity } from "../config";

type MulticallTokensWhitelistFetchFxResponse = {
    data: MulticallContract["tokensWhitelist"] | null;
    error: Error | null;
    loading: boolean;
};

export class MulticallTokensModel {
    static whitelistFetchFx = async (
        daoContractAddress: MulticallEntity.Dependencies["daoContractAddress"],
        callback: (result: MulticallTokensWhitelistFetchFxResponse) => void
    ) =>
        await MulticallContract.instanceDataFetchFx(
            `${ArgsAccount.deconstructAddress(daoContractAddress).name}.${MulticallContract.FACTORY_ADDRESS}`,

            (multicallInstanceData) =>
                callback(Props.evolve({ data: ({ tokensWhitelist }) => tokensWhitelist }, multicallInstanceData))
        );

    static useWhitelist = (daoContractAddress: MulticallEntity.Dependencies["daoContractAddress"]) => {
        const [state, stateUpdate] = useState<MulticallTokensWhitelistFetchFxResponse>({
            data: null,
            error: null,
            loading: true,
        });

        useEffect(
            () => void MulticallTokensModel.whitelistFetchFx(daoContractAddress, stateUpdate),
            [daoContractAddress, stateUpdate]
        );

        return state;
    };
}
