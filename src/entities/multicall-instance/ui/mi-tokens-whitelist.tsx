import { Scrollable, Table, type TableProps, Tile, TileProps } from "../../../shared/ui/design";
import { MulticallInstanceTokensModel } from "../model/mi-tokens";
import { type MulticallInstanceEntity } from "../config";

import {
    type MulticallInstanceWhitelistedTokenProps,
    multicallInstanceWhitelistedTokenToTableRow,
} from "./mi-whitelisted-token";

interface MulticallInstanceTokensWhitelistTableProps
    extends MulticallInstanceEntity.Inputs,
        Pick<TileProps, "footer" | "headingCorners"> {
    ItemProps?: TableProps["RowProps"];
    className?: string;
    itemsAdditional?: MulticallInstanceWhitelistedTokenProps["address"][];
    onItemsSelected?: TableProps["onRowsSelected"];
}

export const MulticallInstanceTokensWhitelistTable = ({
    ItemProps,
    className,
    daoAddress,
    footer,
    headingCorners,
    itemsAdditional,
    onItemsSelected,
}: MulticallInstanceTokensWhitelistTableProps) => {
    const { data, error, loading } = MulticallInstanceTokensModel.useWhitelist(daoAddress);

    return (
        <Tile
            classes={{ root: className }}
            heading="Tokens whitelist"
            noData={data !== null && data.length === 0}
            {...{ error, footer, headingCorners, loading }}
        >
            <Scrollable>
                <Table
                    RowProps={{ centeredTitle: true, entitled: true, noKeys: true, ...ItemProps }}
                    dense
                    displayMode="compact"
                    header={["Contract address"]}
                    onRowsSelected={onItemsSelected}
                    rows={data?.concat(itemsAdditional ?? []).map(multicallInstanceWhitelistedTokenToTableRow)}
                />
            </Scrollable>
        </Tile>
    );
};
