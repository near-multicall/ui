import clsx from "clsx";

import { Tile, Scrollable, Table } from "../../../shared/ui/design";
import { FT, NEARToken } from "../../../entities";

import "./funds-overview.ui.scss";

const _FundsOverview = "FundsOverview";

export interface FundsOverviewUIProps {
    accountName: string;
    className?: string;
}

export const FundsOverviewUI = ({ className, accountName }: FundsOverviewUIProps) => {
    const nearTokenBalances = NEARToken.balancesRender(),
        fungibleTokenBalances = FT.balancesRender({ nonZeroOnly: true });

    return (
        <div className={clsx(_FundsOverview, className)}>
            <Tile
                classes={{ root: `${_FundsOverview}-content` }}
                heading="Token balances"
            >
                {(nearTokenBalances ?? fungibleTokenBalances) && (
                    <Scrollable>
                        <Table
                            RowProps={{ withTitle: true }}
                            header={["Token", "Multicall", accountName, "Total"]}
                            rows={[...(nearTokenBalances ? [nearTokenBalances] : []), ...(fungibleTokenBalances ?? [])]}
                        />
                    </Scrollable>
                )}

                {(!nearTokenBalances || !fungibleTokenBalances) && <div className="loader" />}
            </Tile>
        </div>
    );
};
