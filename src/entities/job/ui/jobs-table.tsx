import clsx from "clsx";

import { Scrollable, Table, Tile } from "../../../shared/ui/components";
import { JobDataModel } from "../model/jobs-data";
import { type JobEntity } from "../config";

import { jobTableRow } from "./job-entry";
import "./jobs-table.scss";

interface JobsTableProps extends JobEntity.Dependencies {}

const _JobsTable = "JobsTable";

export const JobsTable = ({ className, contracts }: JobsTableProps) => {
    const { data, error, loading } = JobDataModel.useAllEntries(contracts);

    return (
        <Tile
            className={clsx(_JobsTable, className)}
            heading="All jobs"
            noData={data !== null && Object.values(data).length === 0}
            {...{ error, loading }}
        >
            <Scrollable>
                <Table
                    className={`${_JobsTable}-body`}
                    displayMode="compact"
                    header={["Status", "ID", "Start at", "Croncat hash", "Creator", "Trigger gas", "Multicalls"]}
                    rows={Object.values(data ?? {}).map(jobTableRow)}
                />
            </Scrollable>
        </Tile>
    );
};
