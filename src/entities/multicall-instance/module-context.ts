import { MulticallSettingsParamKey } from "../../shared/lib/contracts/multicall";
import { SputnikDAO } from "../../shared/lib/contracts/sputnik-dao";
import { toYocto } from "../../shared/lib/converter";

/**
 * Type declaration for Multicall Instance entity
 */
export namespace Entity {
    export interface Inputs {
        daoAddress: SputnikDAO["address"];
    }

    export type ParamKey = MulticallSettingsParamKey;
}

/**
 * Multicall Instance entity config
 */
export class ModuleContext {
    public static readonly ParamKey = MulticallSettingsParamKey;

    /**
     * Minimum balance needed for storage + state.
     */
    public static readonly MIN_BALANCE = toYocto(1);
}
