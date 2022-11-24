import { Scrollable, Table, type TableProps, Tile, TileProps } from "../../../shared/ui/design";
import { MITokensModel } from "../model/mi-tokens";
import { type MI } from "../config";

import { type MIWhitelistedTokenProps, miWhitelistedTokenAsTableRow } from "./mi-whitelisted-token";

interface MITokenWhitelistTableProps extends MI.Inputs, Pick<TileProps, "footer" | "headingCorners"> {
    ItemProps?: TableProps["RowProps"];
    className?: string;
    itemsAdditional?: MIWhitelistedTokenProps["address"][];
    onItemsSelected?: TableProps["onRowsSelected"];
}

export const MITokenWhitelistTable = ({
    ItemProps,
    className,
    daoAddress,
    footer,
    headingCorners,
    itemsAdditional,
    onItemsSelected,
}: MITokenWhitelistTableProps) => {
    const { data, error, loading } = MITokensModel.useWhitelist(daoAddress);

    return (
        <Tile
            classes={{ root: className }}
            heading="Token whitelist"
            noData={data !== null && data.length === 0}
            {...{ error, footer, headingCorners, loading }}
        >
            <Scrollable>
                <Table
                    RowProps={{ centeredTitle: true, withTitle: true, noKeys: true, ...ItemProps }}
                    dense
                    displayMode="compact"
                    header={["Contract address"]}
                    onRowsSelected={onItemsSelected}
                    rows={data?.concat(itemsAdditional ?? []).map(miWhitelistedTokenAsTableRow)}
                />
            </Scrollable>
        </Tile>
    );
};
