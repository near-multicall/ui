import clsx from "clsx";

import { Tile, Scrollable, Table } from "../../../shared/ui/design";
import { FT, FTModule, NEARToken, NEARTokenModule } from "../../../entities";

import "./token-balances.scss";

const _TokenBalances = "TokenBalances";

export interface TokenBalancesProps extends NEARTokenModule.Inputs, FTModule.Inputs {
    className?: string;
}

export const TokenBalances = ({ className, adapters }: TokenBalancesProps) => {
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
