import { useEffect, useState } from "react";

import { ArgsAccount } from "../../../shared/lib/args-old";
import { Multicall } from "../../../shared/lib/contracts/multicall";
import { Props } from "../../../shared/lib/props";
import { type MI } from "../context";

import { MIInfoModel } from "./mi-settings";

export type MIAdminAddresses = {
    data: Multicall["admins"] | null;
    error: Error | null;
    loading: boolean;
};

export class MIAdminsModel {
    static addressListFetchFx = async (
        daoAddress: MI.Inputs["daoAddress"],
        callback: (result: MIAdminAddresses) => void
    ) =>
        await MIInfoModel.dataFetchFx(
            `${ArgsAccount.deconstructAddress(daoAddress).name}.${Multicall.FACTORY_ADDRESS}`,
            (multicallInstanceData) => callback(Props.evolve({ data: ({ admins }) => admins }, multicallInstanceData))
        );

    static useAddressList = (daoAddress: MI.Inputs["daoAddress"]) => {
        const [state, stateUpdate] = useState<MIAdminAddresses>({
            data: null,
            error: null,
            loading: true,
        });

        useEffect(() => void MIAdminsModel.addressListFetchFx(daoAddress, stateUpdate), [daoAddress, stateUpdate]);

        return state;
    };
}
