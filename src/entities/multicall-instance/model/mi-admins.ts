import { useEffect, useState } from "react";

import { ArgsAccount } from "../../../shared/lib/args";
import { MulticallContract } from "../../../shared/lib/contracts/multicall";
import { Props } from "../../../shared/lib/props";

import { type MIEntity } from "../config";

export type MIAdminsAddressList = {
    data: MulticallContract["admins"] | null;
    error: Error | null;
    loading: boolean;
};

export class MIAdminsModel {
    static addressListFetchFx = async (
        controllerContractAddress: MIEntity.Dependencies["controllerContractAddress"],
        callback: (result: MIAdminsAddressList) => void
    ) =>
        await MulticallContract.instanceDataFetchFx(
            `${ArgsAccount.deconstructAddress(controllerContractAddress).name}.${MulticallContract.FACTORY_ADDRESS}`,
            (multicallInstanceData) => callback(Props.evolve({ data: ({ admins }) => admins }, multicallInstanceData))
        );

    static useAddressList = (controllerContractAddress: MIEntity.Dependencies["controllerContractAddress"]) => {
        const [state, stateUpdate] = useState<MIAdminsAddressList>({
            data: null,
            error: null,
            loading: true,
        });

        useEffect(
            () => void MIAdminsModel.addressListFetchFx(controllerContractAddress, stateUpdate),
            [controllerContractAddress, stateUpdate]
        );

        return state;
    };
}
