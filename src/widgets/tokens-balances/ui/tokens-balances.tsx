import clsx from "clsx";

import { Tile, Scrollable, Table } from "../../../shared/ui/design";
import { FT, NEAR } from "../../../entities";
import { type TokenBalancesWidget } from "../config";

import "./tokens-balances.scss";

const _TokenBalances = "TokenBalances";

export const TokenBalances = ({ className, contracts }: TokenBalancesWidget.Inputs) => {
    const nearTokenBalances = NEAR.balancesRender({ contracts }),
        fungibleTokenBalances = FT.balances({ contracts });

    return (
        <Tile
            classes={{ root: clsx(_TokenBalances, className) }}
            heading="Token balances"
        >
            {(nearTokenBalances ?? fungibleTokenBalances) && (
                <Scrollable>
                    <Table
                        RowProps={{ withTitle: true }}
                        header={["Token", "Multicall", "DAO", "Total"]}
                        rows={[...(nearTokenBalances ? [nearTokenBalances] : []), ...(fungibleTokenBalances ?? [])]}
                    />
                </Scrollable>
            )}

            {(!nearTokenBalances || !fungibleTokenBalances) && <div className="loader" />}
        </Tile>
    );
};
