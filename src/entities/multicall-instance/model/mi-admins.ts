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
        controllerContractAddress: MulticallInstanceEntity.Dependencies["controllerContractAddress"],
        callback: (result: MulticallInstanceAdminsAddressList) => void
    ) =>
        await MulticallContract.instanceDataFetchFx(
            `${ArgsAccount.deconstructAddress(controllerContractAddress).name}.${MulticallContract.FACTORY_ADDRESS}`,
            (multicallInstanceData) => callback(Props.evolve({ data: ({ admins }) => admins }, multicallInstanceData))
        );

    static useAddressList = (
        controllerContractAddress: MulticallInstanceEntity.Dependencies["controllerContractAddress"]
    ) => {
        const [state, stateUpdate] = useState<MulticallInstanceAdminsAddressList>({
            data: null,
            error: null,
            loading: true,
        });

        useEffect(
            () => void MulticallInstanceAdminsModel.addressListFetchFx(controllerContractAddress, stateUpdate),
            [controllerContractAddress, stateUpdate]
        );

        return state;
    };
}
