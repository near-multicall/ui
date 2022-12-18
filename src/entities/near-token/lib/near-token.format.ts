import { Big, formatTokenAmount } from "../../../shared/lib/converter";
import { ModuleContext } from "../module-context";

const amountToDisplayAmount = (amount: string, decimals: number): string => {
    const formattedAmount = formatTokenAmount(amount, decimals),
        minimalDisplayAmount = Big("10").pow(-ModuleContext.FRACTIONAL_PART_LENGTH).toFixed();

    return Big(formattedAmount).gt("0") && Big(formattedAmount).lt(minimalDisplayAmount)
        ? "< " + minimalDisplayAmount
        : formatTokenAmount(amount, decimals, ModuleContext.FRACTIONAL_PART_LENGTH);
};

export const NEARTokenFormat = {
    amountToDisplayAmount,
};
