import { Scrollable, Table, Tile } from "../../../shared/ui/components";
import { MulticallInstanceAdminsModel } from "../model/mi-admins";
import { type MulticallInstanceEntity } from "../config";

import { multicallAdminTableRow } from "./mi-admin-entry";

interface MulticallInstanceAdminsTableProps extends MulticallInstanceEntity.Dependencies {
    className?: string;
}

export const MulticallInstanceAdminsTable = ({
    className,
    controllerContractAddress,
}: MulticallInstanceAdminsTableProps) => {
    const { data, error, loading } = MulticallInstanceAdminsModel.useAddressList(controllerContractAddress);

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
                    rows={data?.map(multicallAdminTableRow)}
                />
            </Scrollable>
        </Tile>
    );
};
