import clsx from "clsx";

import { Scrollable, Table, Tile } from "../../../shared/ui/components";
import { JobModel } from "../model/job";
import { type JobEntity } from "../config";

import { jobTableRow } from "./job";
import "./jobs-table.scss";

interface JobsTableProps extends JobEntity.Dependencies {}

const _JobsTable = "JobsTable";

export const JobsTable = ({ className, contracts }: JobsTableProps) => {
    const { data, error, loading } = JobModel.useAllEntries(contracts);

    return (
        <Tile
            classes={{ root: clsx(_JobsTable, className) }}
            heading="All jobs"
            noData={data !== null && Object.values(data).length === 0}
            {...{ error, loading }}
        >
            <Scrollable>
                <Table
                    className={`${_JobsTable}-body`}
                    displayMode="compact"
                    entitled
                    header={["Status", "ID", "Start at", "Croncat hash", "Creator", "Trigger gas", "Multicalls"]}
                    rows={Object.values(data ?? {})
                        .map(jobTableRow)
                        .reverse()}
                />
            </Scrollable>
        </Tile>
    );
};
