import { MulticallPropertyKey } from "../../shared/lib/contracts/multicall";
import { toYocto } from "../../shared/lib/converter";

/**
 * Multicall Instance entity context.
 */
export class ModuleContext {
    public static readonly ParamKey = MulticallPropertyKey;

    /**
     * Minimum balance needed for storage + state.
     */
    public static readonly MIN_BALANCE = toYocto(1);
}
