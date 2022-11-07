import { useEffect, useState } from "react";

import { ArgsAccount } from "../../../shared/lib/args";
import { MulticallContract } from "../../../shared/lib/contracts/multicall";
import { Props } from "../../../shared/lib/props";

import { type MulticallInstanceEntity } from "../config";

export type MulticallInstanceAdminsAddressList = {
    data: MulticallContract["admins"] | null;
    error: Error | null;
    loading: boolean;
};

export class MulticallInstanceAdminsModel {
    static addressListFetchFx = async (
        daoContractAddress: MulticallInstanceEntity.Inputs["daoContractAddress"],
        callback: (result: MulticallInstanceAdminsAddressList) => void
    ) =>
        await MulticallContract.instanceDataFetchFx(
            `${ArgsAccount.deconstructAddress(daoContractAddress).name}.${MulticallContract.FACTORY_ADDRESS}`,
            (multicallInstanceData) => callback(Props.evolve({ data: ({ admins }) => admins }, multicallInstanceData))
        );

    static useAddressList = (daoContractAddress: MulticallInstanceEntity.Inputs["daoContractAddress"]) => {
        const [state, stateUpdate] = useState<MulticallInstanceAdminsAddressList>({
            data: null,
            error: null,
            loading: true,
        });

        useEffect(
            () => void MulticallInstanceAdminsModel.addressListFetchFx(daoContractAddress, stateUpdate),
            [daoContractAddress, stateUpdate]
        );

        return state;
    };
}
