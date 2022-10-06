import { Tile, Scrollable, Table } from "../../../shared/ui/components";
import { FungibleToken, NearToken } from "../../../entities";

import { Dependencies } from "../config";

export const TokensBalances = ({ className, contracts }: Dependencies) => {
    const nearTokenBalances = NearToken.balancesRender({ contracts }),
        fungibleTokensBalances = FungibleToken.allBalancesRender({ contracts });

    return (
        <Tile {...{ className }}>
            <h1 className="title">Tokens balances</h1>

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
