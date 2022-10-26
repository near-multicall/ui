import { type MulticallInstanceEntity, MulticallInstanceEntityConfig } from "./config";
import { MulticallInstanceAdminsTable } from "./ui/mi-admins";
import { MulticallInstanceTokensWhitelistTable } from "./ui/mi-tokens-whitelist";

/**
 * Multicall Instance entity
 */
class MulticallInstance extends MulticallInstanceEntityConfig {
    static AdminsTable = MulticallInstanceAdminsTable;
    static TokensWhitelistTable = MulticallInstanceTokensWhitelistTable;
}

export { MulticallInstance, MulticallInstanceEntity };
