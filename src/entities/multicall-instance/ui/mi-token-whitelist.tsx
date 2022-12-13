import { Scrollable, Table, type TableProps, Tile, TileProps } from "../../../shared/ui/design";
import { MIPropertiesModel } from "../model/mi-properties";

import { MIWhitelistedTokenProps, miWhitelistedTokenAsTableRow } from "./mi-whitelisted-token";

interface MITokenWhitelistTableProps extends Pick<TileProps, "footer" | "headerSlots" | "subheader"> {
    ItemProps?: TableProps["RowProps"];
    className?: string;
    itemsAdditional?: MIWhitelistedTokenProps["address"][];
    onItemsSelected?: TableProps["onRowsSelected"];
}

export const MITokenWhitelistTable = ({
    ItemProps,
    className,
    footer,
    headerSlots,
    itemsAdditional,
    onItemsSelected,
    subheader,
}: MITokenWhitelistTableProps) => {
    const { data, error, loading } = MIPropertiesModel.useContext(),
        items = (data?.tokensWhitelist ?? []).concat(itemsAdditional ?? []);

    return (
        <Tile
            classes={{ root: className }}
            heading="Token whitelist"
            noData={items.length === 0}
            {...{ error, footer, headerSlots, loading, subheader }}
        >
            <Scrollable>
                <Table
                    RowProps={{ centeredTitle: true, withTitle: true, noKeys: true, ...ItemProps }}
                    dense
                    displayMode="compact"
                    header={["Contract address"]}
                    onRowsSelected={onItemsSelected}
                    rows={items.map(miWhitelistedTokenAsTableRow).reverse()}
                />
            </Scrollable>
        </Tile>
    );
};
