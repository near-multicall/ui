import clsx from "clsx";

import { Scrollable, Table, Tile } from "../../../shared/ui/components";
import { MulticallAdminsModel } from "../model/mc-admins";
import { type MulticallEntity } from "../config";

import { multicallAdminTableRow } from "./mc-admin-entry";

interface MulticallAdminsTableProps extends MulticallEntity.Dependencies {
    className?: string;
}

const _MulticallAdminsTable = "MulticallAdminsTable";

export const MulticallAdminsTable = ({ className, daoContractAddress }: MulticallAdminsTableProps) => {
    const { data, error, loading } = MulticallAdminsModel.useAllEntries(daoContractAddress);

    return (
        <Tile
            className={clsx(_MulticallAdminsTable, className)}
            heading="Admins"
            noData={data !== null && data.length === 0}
            {...{ error, loading }}
        >
            <Scrollable>
                <Table
                    className={`${_MulticallAdminsTable}-body`}
                    denseHeader
                    displayMode="compact"
                    header={["Account address"]}
                    rows={data?.map(multicallAdminTableRow)}
                />
            </Scrollable>
        </Tile>
    );
};
