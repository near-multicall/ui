import { Big, formatTokenAmount } from "../../../shared/lib/converter";

import { Config } from "../config";

const amountToDisplayAmount = (amount: string, decimals: number): string => {
    const formattedAmount = formatTokenAmount(amount, decimals),
        minimalDisplayAmount = Big("10").pow(-Config.FRACTIONAL_PART_LENGTH).toFixed();

    return Big(formattedAmount).gt("0") && Big(formattedAmount).lt(minimalDisplayAmount)
        ? "< " + minimalDisplayAmount
        : formatTokenAmount(amount, decimals, Config.FRACTIONAL_PART_LENGTH);
};

export const FTFormat = {
    amountToDisplayAmount,
};
