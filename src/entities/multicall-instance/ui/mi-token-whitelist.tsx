import { Scrollable, Table, type TableProps, Tile, TileProps } from "../../../shared/ui/design";
import { MISettingsModel } from "../model/mi-settings";
import { MISettingsProvider } from "../model/mi-settings-provider";
import { MI } from "../module-context";

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
    const { data, error, loading } = MISettingsModel.useContext(),
        items = (data?.tokensWhitelist ?? []).concat(itemsAdditional ?? []);

    return (
        <MISettingsProvider {...{ daoAddress }}>
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
        </MISettingsProvider>
    );
};
