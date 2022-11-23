import { useEffect, useState } from "react";

import { ArgsAccount } from "../../../shared/lib/args-old";
import { Multicall } from "../../../shared/lib/contracts/multicall";
import { Props } from "../../../shared/lib/props";
import { type MulticallInstanceEntity } from "../config";

import { MulticallInstanceSettingsModel } from "./mi-settings";

export type MulticallInstanceAdminsAddressList = {
    data: Multicall["admins"] | null;
    error: Error | null;
    loading: boolean;
};

export class MulticallInstanceAdminsModel {
    static addressListFetchFx = async (
        daoAddress: MulticallInstanceEntity.Inputs["daoAddress"],
        callback: (result: MulticallInstanceAdminsAddressList) => void
    ) =>
        await MulticallInstanceSettingsModel.fetchFx(
            `${ArgsAccount.deconstructAddress(daoAddress).name}.${Multicall.FACTORY_ADDRESS}`,
            (multicallInstanceData) => callback(Props.evolve({ data: ({ admins }) => admins }, multicallInstanceData))
        );

    static useAddressList = (daoAddress: MulticallInstanceEntity.Inputs["daoAddress"]) => {
        const [state, stateUpdate] = useState<MulticallInstanceAdminsAddressList>({
            data: null,
            error: null,
            loading: true,
        });

        useEffect(
            () => void MulticallInstanceAdminsModel.addressListFetchFx(daoAddress, stateUpdate),
            [daoAddress, stateUpdate]
        );

        return state;
    };
}
