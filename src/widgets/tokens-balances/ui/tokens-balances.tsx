import { Facet, Scrollable, Table } from "../../../shared/ui/components";
import { type DaoContracts } from "../../../entities/types";
import { FungibleToken, NearToken } from "../../../entities";

interface TokensBalancesProps {
    className?: string;
    daoContracts: DaoContracts;
}

export const TokensBalances = ({ className, daoContracts }: TokensBalancesProps) => {
    const nearTokenBalances = NearToken.balancesRender({ daoContracts }),
        fungibleTokensBalances = FungibleToken.allBalancesRender({ daoContracts });

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
