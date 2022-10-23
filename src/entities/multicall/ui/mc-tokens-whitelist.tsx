import clsx from "clsx";

import { FungibleToken } from "../../../shared/lib/standards/fungibleToken";
import { Scrollable, Table, type TableProps, Tile, TileProps } from "../../../shared/ui/components";
import { MulticallTokensModel } from "../model/mc-tokens";
import { type MulticallEntity } from "../config";

import { multicallWhitelistedTokenTableRow } from "./mc-whitelisted-token";

interface MulticallTokensWhitelistTableProps
    extends MulticallEntity.Dependencies,
        Pick<TileProps, "footer" | "headingCorners"> {
    ItemComponent?: TableProps["RowComponent"];
    ItemCompactComponent?: TableProps["RowCompactComponent"];
    additionalItems?: FungibleToken["address"][];
    className?: string;
}

const _MulticallTokensWhitelistTable = "MulticallTokensWhitelistTable";

export const MulticallTokensWhitelistTable = ({
    ItemComponent,
    ItemCompactComponent,
    additionalItems,
    className,
    ownerContractAddress,
    footer,
    headingCorners,
}: MulticallTokensWhitelistTableProps) => {
    const { data, error, loading } = MulticallTokensModel.useWhitelist(ownerContractAddress);

    return (
        <Tile
            classes={{ root: clsx(_MulticallTokensWhitelistTable, className) }}
            heading="Tokens whitelist"
            noData={data !== null && data.length === 0}
            {...{ error, footer, headingCorners, loading }}
        >
            <Scrollable>
                <Table
                    RowComponent={ItemComponent}
                    RowCompactComponent={ItemCompactComponent}
                    className={`${_MulticallTokensWhitelistTable}-body`}
                    denseHeader
                    displayMode="compact"
                    header={["Contract address"]}
                    rows={data?.concat(additionalItems ?? []).map(multicallWhitelistedTokenTableRow)}
                />
            </Scrollable>
        </Tile>
    );
};
