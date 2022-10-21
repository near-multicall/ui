import { Big, formatTokenAmount } from "../../../shared/lib/converter";

import { FungibleTokenConfig } from "../config";

const amountToDisplayAmount = (amount: string, decimals: number): string => {
    const formattedAmount = formatTokenAmount(amount, decimals),
        minimalDisplayAmount = Big("10").pow(-FungibleTokenConfig.FRACTIONAL_PART_LENGTH).toFixed();

    return Big(formattedAmount).gt("0") && Big(formattedAmount).lt(minimalDisplayAmount)
        ? "< " + minimalDisplayAmount
        : formatTokenAmount(amount, decimals, FungibleTokenConfig.FRACTIONAL_PART_LENGTH);
};

export const FungibleTokenFormat = {
    amountToDisplayAmount,
};
