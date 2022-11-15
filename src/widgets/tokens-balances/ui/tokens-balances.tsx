import clsx from "clsx";

import { Tile, Scrollable, Table } from "../../../shared/ui/design";
import { FungibleToken, NearToken } from "../../../entities";

import { type TokensBalancesWidget } from "../config";

import "./tokens-balances.scss";

interface TokensBalancesUIProps extends TokensBalancesWidget.Inputs {}

const _TokensBalances = "TokensBalances";

export const TokensBalancesUI = ({ className, contracts }: TokensBalancesUIProps) => {
    const nearTokenBalances = NearToken.balancesRender({ contracts }),
        fungibleTokensBalances = FungibleToken.allBalancesRender({ contracts });

    return (
        <Tile
            classes={{ root: clsx(_TokensBalances, className) }}
            heading="Tokens balances"
        >
            {(nearTokenBalances ?? fungibleTokensBalances) && (
                <Scrollable>
                    <Table
                        RowProps={{ entitled: true }}
                        header={["Token", "Multicall", "DAO", "Total"]}
                        rows={[...(nearTokenBalances ? [nearTokenBalances] : []), ...(fungibleTokensBalances ?? [])]}
                    />
                </Scrollable>
            )}

            {(!nearTokenBalances || !fungibleTokensBalances) && <div className="loader" />}
        </Tile>
    );
};
