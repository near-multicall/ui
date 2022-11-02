import { SputnikDAOContract } from "../../shared/lib/contracts/sputnik-dao";
import { toYocto } from "../../shared/lib/converter";

/**
 * Type declaration for Multicall Instance entity
 */
namespace MulticallInstanceEntity {
    export interface Dependencies {
        daoContractAddress: SputnikDAOContract["address"];
    }
}

/**
 * Multicall Instance entity config
 */
class MulticallInstanceEntityConfig {
    /**
     * Minimum balance needed for storage + state.
     */
    static MIN_BALANCE = toYocto(1 /* NEAR */);
}

export { MulticallInstanceEntityConfig, type MulticallInstanceEntity };
