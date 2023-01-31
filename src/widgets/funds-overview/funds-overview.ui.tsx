import clsx from "clsx";

import { Tile, Scrollable, Table } from "../../shared/ui/design";
import { FT, NEAR } from "../../entities";

import "./funds-overview.ui.scss";

export interface FundsOverviewUIProps {
    accountName: string;
    className?: string;
}

export const FundsOverviewUI = ({ className, accountName }: FundsOverviewUIProps) => {
    const nearBalances = NEAR.balancesRender(),
        fungibleTokenBalances = FT.balancesRender({ nonZeroOnly: true });

    return (
        <div className={clsx("FundsOverview", className)}>
            <Tile
                classes={{ root: "FundsOverview-content" }}
                heading="Token balances"
            >
                {(nearBalances ?? fungibleTokenBalances) && (
                    <Scrollable>
                        <Table
                            RowProps={{ withTitle: true }}
                            header={["Token", "Multicall", accountName, "Total"]}
                            rows={[...(nearBalances ? [nearBalances] : []), ...(fungibleTokenBalances ?? [])]}
                        />
                    </Scrollable>
                )}

                {(!nearBalances || !fungibleTokenBalances) && <div className="loader" />}
            </Tile>
        </div>
    );
};
