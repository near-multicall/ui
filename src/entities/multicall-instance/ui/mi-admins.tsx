import { Scrollable, Table, Tile } from "../../../shared/ui/components";
import { MulticallInstanceAdminsModel } from "../model/mi-admins";
import { type MulticallInstanceEntity } from "../config";

import { multicallInstanceAdminToTableRow } from "./mi-admin";

interface MulticallInstanceAdminsTableProps extends MulticallInstanceEntity.Dependencies {
    className?: string;
}

export const MulticallInstanceAdminsTable = ({ className, daoContractAddress }: MulticallInstanceAdminsTableProps) => {
    const { data, error, loading } = MulticallInstanceAdminsModel.useAddressList(daoContractAddress);

    return (
        <Tile
            classes={{ root: className }}
            heading="Admins"
            noData={data !== null && data.length === 0}
            {...{ error, loading }}
        >
            <Scrollable>
                <Table
                    RowProps={{ centeredTitle: true, entitled: true, noKeys: true }}
                    dense
                    displayMode="compact"
                    header={["Account address"]}
                    rows={data?.map(multicallInstanceAdminToTableRow)}
                />
            </Scrollable>
        </Tile>
    );
};
