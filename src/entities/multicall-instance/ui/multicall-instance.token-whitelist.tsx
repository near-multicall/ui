import { useContext } from "react";

import { Scrollable, Table, TableProps, Tile, TileProps } from "../../../shared/ui/design";
import { MIModel } from "../model/multicall-instance.model";

import { MIWhitelistedTokenProps, miWhitelistedTokenAsTableRow } from "./multicall-instance.whitelisted-token";

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
    const multicallInstance = useContext(MIModel.Context),
        items = (multicallInstance.data?.tokensWhitelist ?? []).concat(itemsAdditional ?? []),
        tileProps = { ...multicallInstance, footer, headerSlots, subheader };

    return (
        <Tile
            classes={{ root: className }}
            heading="Token whitelist"
            noData={items.length === 0}
            {...tileProps}
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
