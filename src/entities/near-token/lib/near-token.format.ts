import { formatTokenAmount } from "../../../shared/lib/converter";
import { ModuleContext } from "../module-context";

const amountToDisplayAmount = (amount: string): string =>
    formatTokenAmount(amount, ModuleContext.DECIMALS, ModuleContext.FRACTIONAL_PART_LENGTH);

export const NEARTokenFormat = {
    amountToDisplayAmount,
};
