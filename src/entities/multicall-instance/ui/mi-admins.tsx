import { Scrollable, Table, Tile } from "../../../shared/ui/design";
import { MIAdminsModel } from "../model/mi-admins";
import { MI } from "../module-context";

import { miAdminAsTableRow } from "./mi-admin";

interface MIAdminsTableProps extends MI.Inputs {
    className?: string;
}

export const MIAdminsTable = ({ className, daoAddress }: MIAdminsTableProps) => {
    const { data, error, loading } = MIAdminsModel.useAddressList(daoAddress);

    return (
        <Tile
            classes={{ root: className }}
            heading="Admins"
            noData={data !== null && data.length === 0}
            {...{ error, loading }}
        >
            <Scrollable>
                <Table
                    RowProps={{ centeredTitle: true, withTitle: true, noKeys: true }}
                    dense
                    displayMode="compact"
                    header={["Account address"]}
                    rows={data?.map(miAdminAsTableRow)}
                />
            </Scrollable>
        </Tile>
    );
};
