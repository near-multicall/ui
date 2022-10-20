import { useEffect, useState } from "react";

import { ArgsAccount } from "../../../shared/lib/args";
import { MulticallContract } from "../../../shared/lib/contracts/multicall";
import { Props } from "../../../shared/lib/props";

import { type MulticallEntity } from "../config";

type MulticallAdminsAllEntriesFetchFxResponse = {
    data: MulticallContract["admins"] | null;
    error: Error | null;
    loading: boolean;
};

export class MulticallAdminsModel {
    static allEntriesFetchFx = async (
        daoContractAddress: MulticallEntity.Dependencies["daoContractAddress"],
        callback: (result: MulticallAdminsAllEntriesFetchFxResponse) => void
    ) =>
        await MulticallContract.instanceDataFetchFx(
            `${ArgsAccount.deconstructAddress(daoContractAddress).name}.${MulticallContract.FACTORY_ADDRESS}`,
            (multicallInstanceData) => callback(Props.evolve({ data: ({ admins }) => admins }, multicallInstanceData))
        );

    static useAllEntries = (daoContractAddress: MulticallEntity.Dependencies["daoContractAddress"]) => {
        const [state, stateUpdate] = useState<MulticallAdminsAllEntriesFetchFxResponse>({
            data: null,
            error: null,
            loading: true,
        });

        useEffect(
            () => void MulticallAdminsModel.allEntriesFetchFx(daoContractAddress, stateUpdate),
            [daoContractAddress, stateUpdate]
        );

        return state;
    };
}
