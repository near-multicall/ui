import { type MulticallConfigChanges } from "../../shared/lib/contracts/multicall";
import { SputnikDAOContract } from "../../shared/lib/contracts/sputnik-dao";

/**
 * Type declaration for Multicall Instance entity
 */
namespace MIEntity {
    export interface Dependencies {
        controllerContractAddress: SputnikDAOContract["address"];
    }

    export type ConfigChanges = MulticallConfigChanges;
}

/**
 * Multicall Instance entity config
 */
class MIEntityConfig {
    // all the constants must be grouped in objects whenever it's possible and stored here as static properties
}

export { MIEntityConfig, type MIEntity };
