import Big from "big.js";
import { useContext } from "react";

import { IconLabel, NearIcon } from "../../../shared/ui/design";
import { FTFormat } from "../lib/fungible-token.format";
import { FTModel } from "../model/fungible-token.model";

export interface FTBalancesProps {
    nonZeroOnly?: boolean;
}

export const ftBalancesRender = ({ nonZeroOnly = false }: FTBalancesProps) => {
    const { data } = useContext(FTModel.BalancesContext),
        items = nonZeroOnly ? data?.filter(({ total }) => Big(total).gt("0")) : data;

    return (
        items?.map(({ account, metadata, multicallInstance, total }) => ({
            content: [
                <IconLabel
                    icon={metadata.icon ?? <NearIcon.GenericTokenFilled />}
                    label={metadata.symbol}
                />,

                FTFormat.amountToDisplayAmount(multicallInstance, metadata.decimals),
                FTFormat.amountToDisplayAmount(account, metadata.decimals),
                FTFormat.amountToDisplayAmount(total, metadata.decimals),
            ],

            id: metadata.symbol,
        })) ?? null
    );
};
