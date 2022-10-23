import clsx from "clsx";

import { FungibleToken } from "../../../shared/lib/standards/fungibleToken";
import { Scrollable, Table, type TableProps, Tile, TileProps } from "../../../shared/ui/components";
import { MITokensModel } from "../model/mi-tokens";
import { type MIEntity } from "../config";

import { miWhitelistedTokenTableRowRender } from "./mi-whitelisted-token";

interface MITokensWhitelistTableProps extends MIEntity.Dependencies, Pick<TileProps, "footer" | "headingCorners"> {
    ItemComponent?: TableProps["RowComponent"];
    ItemCompactComponent?: TableProps["RowCompactComponent"];
    additionalItems?: FungibleToken["address"][];
    className?: string;
}

const _MITokensWhitelistTable = "MITokensWhitelistTable";

export const MITokensWhitelistTable = ({
    ItemComponent,
    ItemCompactComponent,
    additionalItems,
    className,
    controllerContractAddress,
    footer,
    headingCorners,
}: MITokensWhitelistTableProps) => {
    const { data, error, loading } = MITokensModel.useWhitelist(controllerContractAddress);

    return (
        <Tile
            classes={{ root: clsx(_MITokensWhitelistTable, className) }}
            heading="Tokens whitelist"
            noData={data !== null && data.length === 0}
            {...{ error, footer, headingCorners, loading }}
        >
            <Scrollable>
                <Table
                    RowComponent={ItemComponent}
                    RowCompactComponent={ItemCompactComponent}
                    className={`${_MITokensWhitelistTable}-body`}
                    denseHeader
                    displayMode="compact"
                    header={["Contract address"]}
                    rows={data?.concat(additionalItems ?? []).map(miWhitelistedTokenTableRowRender)}
                />
            </Scrollable>
        </Tile>
    );
};
