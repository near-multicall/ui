import { Scrollable, Table, Tile } from "../../../shared/ui/design";
import { MulticallInstanceAdminsModel } from "../model/mi-admins";
import { type MulticallInstanceEntity } from "../config";

import { multicallInstanceAdminToTableRow } from "./mi-admin";

interface MulticallInstanceAdminsTableProps extends MulticallInstanceEntity.Inputs {
    className?: string;
}

export const MulticallInstanceAdminsTable = ({ className, daoAddress }: MulticallInstanceAdminsTableProps) => {
    const { data, error, loading } = MulticallInstanceAdminsModel.useAddressList(daoAddress);

    return (
        <Tile
            classes={{ root: className }}
            heading="Admins"
            noData={data !== null && data.length === 0}
            {...{ error, loading }}
        >
            <Scrollable>
                <Table
                    RowProps={{ centeredTitle: true, withTitile: true, noKeys: true }}
                    dense
                    displayMode="compact"
                    header={["Account address"]}
                    rows={data?.map(multicallInstanceAdminToTableRow)}
                />
            </Scrollable>
        </Tile>
    );
};
