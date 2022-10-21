import { useEffect, useState } from "react";

import { ArgsAccount } from "../../../shared/lib/args";
import { MulticallContract } from "../../../shared/lib/contracts/multicall";
import { Props } from "../../../shared/lib/props";

import { type MulticallEntity } from "../config";

export type MulticallAdminsAddressList = {
    data: MulticallContract["admins"] | null;
    error: Error | null;
    loading: boolean;
};

export class MulticallAdminsModel {
    static addressListFetchFx = async (
        daoContractAddress: MulticallEntity.Dependencies["daoContractAddress"],
        callback: (result: MulticallAdminsAddressList) => void
    ) =>
        await MulticallContract.instanceDataFetchFx(
            `${ArgsAccount.deconstructAddress(daoContractAddress).name}.${MulticallContract.FACTORY_ADDRESS}`,
            (multicallInstanceData) => callback(Props.evolve({ data: ({ admins }) => admins }, multicallInstanceData))
        );

    static useAddressList = (daoContractAddress: MulticallEntity.Dependencies["daoContractAddress"]) => {
        const [state, stateUpdate] = useState<MulticallAdminsAddressList>({
            data: null,
            error: null,
            loading: true,
        });

        useEffect(
            () => void MulticallAdminsModel.addressListFetchFx(daoContractAddress, stateUpdate),
            [daoContractAddress, stateUpdate]
        );

        return state;
    };
}
