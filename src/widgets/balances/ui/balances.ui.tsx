import clsx from "clsx";

import { Tile, Scrollable, Table } from "../../../shared/ui/design";
import {
    FT,
    FTBalancesProps,
    FTBalancesProviderProps,
    NEARToken,
    NEARTokenBalancesProps,
    NEARTokenBalancesProviderProps,
} from "../../../entities";

import "./balances.ui.scss";

const _Balances = "Balances";

export interface BalancesProps
    extends FTBalancesProps,
        FTBalancesProviderProps,
        NEARTokenBalancesProps,
        NEARTokenBalancesProviderProps {
    accountName: string;
    className?: string;
}

export const Balances = ({ className, accountId, accountName, nonZeroOnly = true }: BalancesProps) => {
    const nearTokenBalances = NEARToken.balancesRender({ nonZeroOnly }),
        fungibleTokenBalances = FT.balancesRender({ nonZeroOnly });

    return (
        <NEARToken.BalancesProvider {...{ accountId }}>
            <FT.BalancesProvider {...{ accountId }}>
                <Tile
                    classes={{ root: clsx(_Balances, className) }}
                    heading="Token balances"
                >
                    {(nearTokenBalances ?? fungibleTokenBalances) && (
                        <Scrollable>
                            <Table
                                RowProps={{ withTitle: true }}
                                header={["Token", "Multicall", accountName, "Total"]}
                                rows={[
                                    ...(nearTokenBalances ? [nearTokenBalances] : []),
                                    ...(fungibleTokenBalances ?? []),
                                ]}
                            />
                        </Scrollable>
                    )}

                    {(!nearTokenBalances || !fungibleTokenBalances) && <div className="loader" />}
                </Tile>
            </FT.BalancesProvider>
        </NEARToken.BalancesProvider>
    );
};
