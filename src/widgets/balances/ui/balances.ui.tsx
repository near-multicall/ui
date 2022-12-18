import clsx from "clsx";
import { ComponentProps } from "react";

import { Tile, Scrollable, Table } from "../../../shared/ui/design";
import { FT, NEARToken } from "../../../entities";

import "./balances.ui.scss";

const _Balances = "Balances";

export interface BalancesProps
    extends ComponentProps<typeof FT["BalancesProvider"]>,
        ComponentProps<typeof NEARToken["BalancesProvider"]> {
    accountName: string;
    className?: string;
}

export const Balances = ({ className, accountId, accountName }: BalancesProps) => {
    const nearTokenBalances = NEARToken.balancesRender(),
        fungibleTokenBalances = FT.balancesRender({ nonZeroOnly: true });

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
