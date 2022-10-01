import { Card, Scrollable, Table } from "../../../shared/ui/components";
import { type DaoContracts } from "../../../entities/types";
import { FungibleToken, NativeToken } from "../../../entities";

export interface TokensBalancesProps {
    className?: string;
    contracts: DaoContracts;
}

export const TokensBalances = ({ className, contracts }: TokensBalancesProps) => {
    const nativeTokenBalances = NativeToken.balancesRender({ contracts }),
        fungibleTokensBalances = FungibleToken.allBalancesRender({ contracts });

    return (
        <Card {...{ className }}>
            <h1 className="title">Token Balances</h1>

            {!nativeTokenBalances || !fungibleTokensBalances ? (
                <div className="loader" />
            ) : (
                <Scrollable>
                    <Table
                        header={["Token", "Multicall", "DAO", "Total"]}
                        rows={[nativeTokenBalances].concat(fungibleTokensBalances)}
                    />
                </Scrollable>
            )}
        </Card>
    );
};
