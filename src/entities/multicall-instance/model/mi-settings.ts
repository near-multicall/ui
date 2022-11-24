import { ArgsAccount } from "../../../shared/lib/args-old";
import { Multicall } from "../../../shared/lib/contracts/multicall";
import { AccountId } from "../../../shared/lib/types";

export class MIInfoModel {
    /**
     * Calls the given callback with a result of multicall contract instantiation,
     * represented as stateful response.
     *
     * @param daoAddress DAO contract address
     * @param callback Stateful data fetch callback
     */
    static dataFetchFx = async (
        daoAddress: AccountId,
        callback: (result: { data: Multicall | null; error: Error | null; loading: boolean }) => void
    ) =>
        callback(
            await Multicall.init(
                `${ArgsAccount.deconstructAddress(daoAddress).name}.${Multicall.FACTORY_ADDRESS}`
            ).then((multicallInstance) => ({
                data: multicallInstance.ready ? multicallInstance : null,
                error: multicallInstance.ready ? null : new Error("Unable to connect to Multicall Instance"),
                loading: false,
            }))
        );
}
