import { useContext } from "react";
import { Scrollable, Table, Tile } from "../../../shared/ui/design";
import { MIModel } from "../model/mi-model";

import { miAdminAsTableRow, MIAdminProps } from "./mi-admin";

interface MIAdminsTableProps {
    className?: string;
    itemsAdditional?: MIAdminProps["address"][];
}

export const MIAdminsTable = ({ className, itemsAdditional }: MIAdminsTableProps) => {
    const { data, error, loading } = useContext(MIModel.Context),
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
