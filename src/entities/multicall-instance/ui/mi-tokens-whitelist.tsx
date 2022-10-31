import { FungibleToken } from "../../../shared/lib/standards/fungibleToken";
import { Scrollable, Table, type TableProps, Tile, TileProps } from "../../../shared/ui/components";
import { MulticallInstanceTokensModel } from "../model/mi-tokens";
import { type MulticallInstanceEntity } from "../config";

import { multicallInstanceWhitelistedTokenToTableRow } from "./mi-whitelisted-token";

interface MulticallInstanceTokensWhitelistTableProps
    extends MulticallInstanceEntity.Dependencies,
        Pick<TileProps, "footer" | "headingCorners"> {
    ItemProps?: TableProps["RowProps"];
    additionalItems?: FungibleToken["address"][];
    className?: string;
    onItemsSelected?: TableProps["onRowsSelected"];
}

export const MulticallInstanceTokensWhitelistTable = ({
    ItemProps,
    additionalItems,
    className,
    daoContractAddress,
    footer,
    headingCorners,
    onItemsSelected,
}: MulticallInstanceTokensWhitelistTableProps) => {
    const { data, error, loading } = MulticallInstanceTokensModel.useWhitelist(daoContractAddress);

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
                    rows={data?.concat(additionalItems ?? []).map(multicallInstanceWhitelistedTokenToTableRow)}
                />
            </Scrollable>
        </Tile>
    );
};
