import clsx from "clsx";

import { Tile, Scrollable, Table } from "../../../shared/ui/design";
import { FT, NEARToken } from "../../../entities";
import { type TokenBalances } from "../context";

import "./token-balances.scss";

const _TokenBalances = "TokenBalances";

export const TokenBalancesUI = ({ className, adapters }: TokenBalances.Inputs) => {
    const nearTokenBalances = NEARToken.balancesRender({ adapters }),
        fungibleTokenBalances = FT.balances({ adapters });

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
