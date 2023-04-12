import { formatTokenAmount } from "../../shared/lib/converter";

import { NEARParams } from "./near.params";

export class NEARLib {
    public static readonly amountToDisplayAmount = (amount: string): string =>
        formatTokenAmount(amount, NEARParams.DECIMALS, NEARParams.FRACTIONAL_PART_LENGTH);
}
