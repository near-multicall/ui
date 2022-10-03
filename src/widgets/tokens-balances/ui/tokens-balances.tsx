import { Facet, Scrollable, Table } from "../../../shared/ui/components";
import { type DaoContracts } from "../../../entities/types";
import { FungibleToken, NearToken } from "../../../entities";

interface TokensBalancesProps {
    className?: string;
    contracts: DaoContracts;
}

export const TokensBalances = ({ className, contracts }: TokensBalancesProps) => {
    const nearTokenBalances = NearToken.balancesRender({ contracts }),
        fungibleTokensBalances = FungibleToken.allBalancesRender({ contracts });

    return (
        <Facet {...{ className }}>
            <h1 className="title">Tokens balances</h1>

            {!nearTokenBalances ?? !fungibleTokensBalances ? (
                <div className="loader" />
            ) : (
                <Scrollable>
                    <Table
                        header={["Token", "Multicall", "DAO", "Total"]}
                        rows={[nearTokenBalances].concat(fungibleTokensBalances)}
                    />
                </Scrollable>
            )}
        </Facet>
    );
};
