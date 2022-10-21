import clsx from "clsx";

import { FungibleToken } from "../../../shared/lib/standards/fungibleToken";
import { Scrollable, Table, type TableProps, Tile, TileProps } from "../../../shared/ui/components";
import { MulticallTokensModel } from "../model/mc-tokens";
import { type MulticallEntity } from "../config";

import { multicallWhitelistedTokenTableRow } from "./mc-whitelisted-token";

interface MulticallTokensWhitelistTableProps
    extends MulticallEntity.Dependencies,
        Pick<TileProps, "footer" | "headingCorners"> {
    additionalItems?: FungibleToken["address"][];
    className?: string;
    customItemRenderer?: (item: FungibleToken["address"]) => JSX.Element[];
}

const _MulticallTokensWhitelistTable = "MulticallTokensWhitelistTable";

export const MulticallTokensWhitelistTable = ({
    additionalItems,
    className,
    customItemRenderer,
    daoContractAddress,
    footer,
    headingCorners,
}: MulticallTokensWhitelistTableProps) => {
    const { data, error, loading } = MulticallTokensModel.useWhitelist(daoContractAddress);

    return (
        <Tile
            classes={{ root: clsx(_MulticallTokensWhitelistTable, className) }}
            heading="Tokens whitelist"
            noData={data !== null && data.length === 0}
            {...{ error, footer, headingCorners, loading }}
        >
            <Scrollable>
                <Table
                    className={`${_MulticallTokensWhitelistTable}-body`}
                    denseHeader
                    displayMode="compact"
                    header={["Contract address"]}
                    rows={data
                        ?.concat(additionalItems ?? [])
                        .map(customItemRenderer ?? multicallWhitelistedTokenTableRow)}
                />
            </Scrollable>
        </Tile>
    );
};
