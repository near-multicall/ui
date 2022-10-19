import { SputnikDAOContract } from "../../shared/lib/contracts/sputnik-dao";

namespace MulticallEntity {
    export interface Dependencies {
        daoContractAddress: SputnikDAOContract["address"];
    }
}

class MulticallConfig {
    // all the constants must be grouped in objects whenever it's possible and stored here as static properties
}

export { MulticallConfig, type MulticallEntity };
