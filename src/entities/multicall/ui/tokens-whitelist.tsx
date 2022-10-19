import clsx from "clsx";

import { Placeholder, Scrollable, Table, Tile } from "../../../shared/ui/components";

import { TokensWhitelistModel } from "../model/tokens-whitelist";
import { type MulticallEntity } from "../config";
import { multicallWhitelistedTokenTableRow } from "./whitelisted-token";

interface MulticallTokensWhitelistProps extends MulticallEntity.Dependencies {
    className?: string;
}

const _MulticallTokensWhitelist = "MulticallTokensWhitelist";

export const MulticallTokensWhitelist = ({ className, daoContractAddress }: MulticallTokensWhitelistProps) => {
    const { data, error, loading } = TokensWhitelistModel.useAllTokensFor(daoContractAddress),
        dataIsAvailable = data !== null && !loading && data.length > 0,
        noData = data !== null && !loading && data.length === 0;

    return (
        <Tile
            className={clsx(_MulticallTokensWhitelist, className)}
            heading="Tokens whitelist"
        >
            {loading && <div className="loader" />}
            {noData && <Placeholder type="noData" />}

            {error && (
                <Placeholder
                    payload={{ error }}
                    type="unknownError"
                />
            )}

            {dataIsAvailable && (
                <Scrollable>
                    <Table
                        className={`${_MulticallTokensWhitelist}-body`}
                        displayMode="compact"
                        header={["Contract address"]}
                        rows={data.map(multicallWhitelistedTokenTableRow)}
                    />
                </Scrollable>
            )}
        </Tile>
    );
};
