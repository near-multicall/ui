import { Big, formatTokenAmount } from "../../shared/lib/converter";

import { FTParams } from "./ft.params";

export class FTLib {
    public static readonly amountToDisplayAmount = (amount: string, decimals: number): string => {
        const formattedAmount = formatTokenAmount(amount, decimals),
            minimalDisplayAmount = Big("10").pow(-FTParams.FRACTIONAL_PART_LENGTH).toFixed();

        return Big(formattedAmount).gt("0") && Big(formattedAmount).lt(minimalDisplayAmount)
            ? "< " + minimalDisplayAmount
            : formatTokenAmount(amount, decimals, FTParams.FRACTIONAL_PART_LENGTH);
    };
}
