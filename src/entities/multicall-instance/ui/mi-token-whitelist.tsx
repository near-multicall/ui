import { Scrollable, Table, type TableProps, Tile, TileProps } from "../../../shared/ui/design";
import { MITokensModel } from "../model/mi-tokens";
import { MI } from "../context";

import { MIWhitelistedTokenProps, miWhitelistedTokenAsTableRow } from "./mi-whitelisted-token";

interface MITokenWhitelistTableProps extends MI.Inputs, Pick<TileProps, "footer" | "headerSlots" | "subheader"> {
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
    headerSlots,
    itemsAdditional,
    onItemsSelected,
    subheader,
}: MITokenWhitelistTableProps) => {
    const { data, error, loading } = MITokensModel.useWhitelist(daoAddress);
    const allItems = data?.concat(itemsAdditional ?? []);

    return (
        <Tile
            classes={{ root: className }}
            heading="Token whitelist"
            noData={data !== null && allItems?.length === 0}
            {...{ error, footer, headerSlots, loading, subheader }}
        >
            <Scrollable>
                <Table
                    RowProps={{ centeredTitle: true, withTitle: true, noKeys: true, ...ItemProps }}
                    dense
                    displayMode="compact"
                    header={["Contract address"]}
                    onRowsSelected={onItemsSelected}
                    rows={allItems?.map(miWhitelistedTokenAsTableRow)}
                />
            </Scrollable>
        </Tile>
    );
};
