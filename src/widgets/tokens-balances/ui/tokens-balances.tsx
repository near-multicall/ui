import { Tile, Scrollable, Table } from "../../../shared/ui/components";
import { FungibleToken, NearToken } from "../../../entities";

import { type TokensBalancesWidget } from "../config";

export const TokensBalances = ({ className, contracts }: TokensBalancesWidget.Dependencies) => {
    const nearTokenBalances = NearToken.balancesRender({ contracts }),
        fungibleTokensBalances = FungibleToken.allBalancesRender({ contracts });

    return (
        <Tile
            {...{ className }}
            title="Tokens balances"
        >
            {(nearTokenBalances ?? fungibleTokensBalances) && (
                <Scrollable>
                    <Table
                        header={["Token", "Multicall", "DAO", "Total"]}
                        rows={[...(nearTokenBalances ? [nearTokenBalances] : []), ...(fungibleTokensBalances ?? [])]}
                    />
                </Scrollable>
            )}

            {(!nearTokenBalances || !fungibleTokensBalances) && <div className="loader" />}
        </Tile>
    );
};
