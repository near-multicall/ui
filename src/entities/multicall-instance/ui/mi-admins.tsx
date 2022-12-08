import { Scrollable, Table, Tile } from "../../../shared/ui/design";
import { MISettingsModel } from "../model/mi-settings";
import { MI } from "../module-context";

import { miAdminAsTableRow, MIAdminProps } from "./mi-admin";

interface MIAdminsTableProps extends MI.Inputs {
    className?: string;
    itemsAdditional?: MIAdminProps["address"][];
}

export const MIAdminsTable = ({ className, itemsAdditional }: MIAdminsTableProps) => {
    const { data, error, loading } = MISettingsModel.useContext(),
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
