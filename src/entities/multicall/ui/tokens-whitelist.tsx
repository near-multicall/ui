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
    const { data, error, loading } = TokensWhitelistModel.useAllTokensFor(daoContractAddress);

    return (
        <Tile
            className={clsx(_MulticallTokensWhitelist, className)}
            heading="Tokens whitelist"
            noData={data !== null && data.length === 0}
            {...{ error, loading }}
        >
            <Scrollable>
                <Table
                    className={`${_MulticallTokensWhitelist}-body`}
                    displayMode="compact"
                    header={["Contract address"]}
                    rows={data?.map(multicallWhitelistedTokenTableRow)}
                />
            </Scrollable>
        </Tile>
    );
};
