import clsx from "clsx";

import { Scrollable, Table, Tile } from "../../../shared/ui/components";
import { MIAdminsModel } from "../model/mi-admins";
import { type MulticallInstanceEntity } from "../config";

import { multicallAdminTableRow } from "./mi-admin-entry";

interface MIAdminsTableProps extends MulticallInstanceEntity.Dependencies {
    className?: string;
}

const _MIAdminsTable = "MIAdminsTable";

export const MIAdminsTable = ({ className, controllerContractAddress }: MIAdminsTableProps) => {
    const { data, error, loading } = MIAdminsModel.useAddressList(controllerContractAddress);

    return (
        <Tile
            classes={{ root: clsx(_MIAdminsTable, className) }}
            heading="Admins"
            noData={data !== null && data.length === 0}
            {...{ error, loading }}
        >
            <Scrollable>
                <Table
                    className={`${_MIAdminsTable}-body`}
                    dense
                    displayMode="compact"
                    header={["Account address"]}
                    rows={data?.map(multicallAdminTableRow)}
                />
            </Scrollable>
        </Tile>
    );
};
