import { PropsWithChildren, useContext } from "react";

import { FungibleToken } from "../../shared/lib/standards/fungibleToken";
import { NEARLink, NEARLinkProps, Scrollable, Table, TableProps, Tile, TileProps } from "../../shared/ui/design";

import { MIService, IMIService } from "./mi.service";

export interface MIContextProviderProps extends Pick<PropsWithChildren, "children">, IMIService {}

export const MIContextProvider = ({ children, ...modelInputs }: MIContextProviderProps) => (
    <MIService.Context.Provider value={MIService.usePropertiesState(modelInputs)}>
        {children}
    </MIService.Context.Provider>
);

export interface MIAdminProps extends NEARLinkProps {}

const MIAdmin = ({ address }: MIAdminProps) => (
    <span>
        <NEARLink {...{ address }} />
    </span>
);

export const miAdminAsTableRow = (item: MIAdminProps["address"]) => ({
    content: [<MIAdmin address={item} />],
    id: item,
});

interface MIAdminsTableProps {
    className?: string;
    itemsAdditional?: MIAdminProps["address"][];
}

export const MIAdminsTable = ({ className, itemsAdditional }: MIAdminsTableProps) => {
    const { data, error, loading } = useContext(MIService.Context),
        items = (data?.admins ?? []).concat(itemsAdditional ?? []);

    return (
        <Tile
            classes={{ root: className }}
            heading="Admins"
            noData={items.length === 0}
            {...{ error, loading }}
        >
            <Scrollable>
                <Table
                    RowProps={{ centeredTitle: true, withTitle: true, noKeys: true }}
                    dense
                    displayMode="compact"
                    header={["Account address"]}
                    rows={items.map(miAdminAsTableRow)}
                />
            </Scrollable>
        </Tile>
    );
};

export interface MIWhitelistedTokenProps {
    address: FungibleToken["address"];
}

const MIWhitelistedToken = ({ address }: MIWhitelistedTokenProps) => (
    <span>
        <NEARLink {...{ address }} />
    </span>
);

export const miWhitelistedTokenAsTableRow = (item: MIWhitelistedTokenProps["address"]) => ({
    content: [<MIWhitelistedToken address={item} />],
    id: item,
});

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
    const multicallInstance = useContext(MIService.Context),
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
