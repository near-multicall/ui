import { Card, NearIcons, Scrollable, Table } from "../../../shared/ui/components";
import { BalancesModel } from "../model/balances";
import { ContractsData } from "../types";
import "./fungible.scss";

interface FungibleTokenLabelProps {
    icon?: string | JSX.Element | null;
    native?: boolean;
    symbol?: string;
}

export const FungibleTokenLabel = ({ icon, native, symbol }: FungibleTokenLabelProps) => (
    <span className="token-label">
        {!native && typeof icon === "string" ? (
            <img
                className="icon"
                loading="lazy"
                src={icon}
            />
        ) : (
            <span className="icon">
                {native ? <NearIcons.NativeTokenFilled /> : icon || <NearIcons.GenericTokenFilled />}
            </span>
        )}

        <span className="symbol">{native ? "NEAR" : symbol}</span>
    </span>
);

interface FungibleTokenBalancesProps extends ContractsData {
    className?: string;
}

export const FungibleTokenBalances = ({ className, dao, multicall }: FungibleTokenBalancesProps) => {
    const nativeToken = BalancesModel.useNativeTokenData({ dao, multicall }),
        customTokens = BalancesModel.useCustomTokensData({ dao, multicall }),
        loading = nativeToken.loading || customTokens.loading;

    const tableContent = [
        nativeToken.data && [
            <FungibleTokenLabel native />,
            nativeToken.data.multicall,
            nativeToken.data.dao,
            nativeToken.data.total,
        ],
    ].concat(
        customTokens.data &&
            customTokens.data.map((customToken) => [
                <FungibleTokenLabel {...customToken.metadata} />,
                customToken.multicall,
                customToken.dao,
                customToken.total,
            ])
    );

    return (
        <Card {...{ className }}>
            <h1 className="title">Fungible Token Balances</h1>

            {loading ? (
                <div className="loader" />
            ) : (
                <Scrollable>
                    <Table
                        header={["Token", "Multicall", "DAO", "Total"]}
                        rows={tableContent}
                    />
                </Scrollable>
            )}
        </Card>
    );
};
