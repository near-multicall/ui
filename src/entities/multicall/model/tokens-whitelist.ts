import { useEffect, useState } from "react";

import { ArgsAccount } from "../../../shared/lib/args";
import { MulticallContract } from "../../../shared/lib/contracts/multicall";
import { Props } from "../../../shared/lib/props";

import { type MulticallEntity } from "../config";

type WhitelistedTokensDataFxResponse = {
    data: MulticallContract["tokensWhitelist"] | null;
    error: Error | null;
    loading: boolean;
};

const whitelistedTokensDataFx = async (
    daoContractAddress: MulticallEntity.Dependencies["daoContractAddress"],
    callback: (result: WhitelistedTokensDataFxResponse) => void
) =>
    await MulticallContract.instanceDataFetchFx(
        `${ArgsAccount.deconstructAddress(daoContractAddress).name}.${MulticallContract.FACTORY_ADDRESS}`,

        (multicallInstanceData) =>
            callback(Props.evolve({ data: ({ tokensWhitelist }) => tokensWhitelist }, multicallInstanceData))
    );

const useAllWhitelistedTokensData = (daoContractAddress: MulticallEntity.Dependencies["daoContractAddress"]) => {
    const [state, stateUpdate] = useState<WhitelistedTokensDataFxResponse>({ data: null, error: null, loading: true });

    useEffect(() => void whitelistedTokensDataFx(daoContractAddress, stateUpdate), []);

    return state;
};

export class TokensWhitelistModel {
    static useAllTokensFor = useAllWhitelistedTokensData;
}
