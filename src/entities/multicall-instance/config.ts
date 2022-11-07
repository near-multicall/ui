import { MulticallConfigParamKey } from "../../shared/lib/contracts/multicall";
import { SputnikDAOContract } from "../../shared/lib/contracts/sputnik-dao";
import { toYocto } from "../../shared/lib/converter";

/**
 * Type declaration for Multicall Instance entity
 */
namespace MulticallInstanceEntity {
    export interface Inputs {
        daoContractAddress: SputnikDAOContract["address"];
    }

    export type ParamKey = MulticallConfigParamKey;
}

/**
 * Multicall Instance entity config
 */
class MulticallInstanceEntityConfig {
    public static readonly ParamKey = MulticallConfigParamKey;

    /**
     * Minimum balance needed for storage + state.
     */
    public static readonly MIN_BALANCE = toYocto(1 /* NEAR */);
}

export { MulticallInstanceEntityConfig, type MulticallInstanceEntity };
