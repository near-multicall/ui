import Big from "big.js";
import { PropsWithChildren, useContext } from "react";

import { IconLabel, NEARIcon } from "../../shared/ui/design";

import { FTLib } from "./ft.lib";
import { FTService, IFTService } from "./ft.service";

interface FTBalancesProviderProps extends Pick<PropsWithChildren, "children">, IFTService {}

export const FTBalancesProvider = ({ children, ...modelInputs }: FTBalancesProviderProps) => (
    <FTService.BalancesContext.Provider value={FTService.useBalancesState(modelInputs)}>
        {children}
    </FTService.BalancesContext.Provider>
);

interface FTBalancesProps {
    nonZeroOnly?: boolean;
}

export const ftBalancesRender = ({ nonZeroOnly = false }: FTBalancesProps) => {
    const { data } = useContext(FTService.BalancesContext),
        items = nonZeroOnly ? data?.filter(({ total }) => Big(total).gt("0")) : data;

    return (
        items?.map(({ account, metadata, multicallInstance, total }) => ({
            content: [
                <IconLabel
                    icon={metadata.icon ?? <NEARIcon.GenericTokenFilled />}
                    label={metadata.symbol}
                />,

                FTLib.amountToDisplayAmount(multicallInstance, metadata.decimals),
                FTLib.amountToDisplayAmount(account, metadata.decimals),
                FTLib.amountToDisplayAmount(total, metadata.decimals),
            ],

            id: metadata.symbol,
        })) ?? null
    );
};
