import clsx from "clsx";

import { Scrollable, Table, Tile } from "../../../shared/ui/design";
import { JobModel } from "../model/job";
import { type JobEntity } from "../context";

import { jobTableRowRender } from "./job";
import "./jobs-table.scss";

interface JobsTableProps extends JobEntity.Inputs {}

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
                    RowProps={{ withTitle: true }}
                    className={`${_JobsTable}-body`}
                    displayMode="compact"
                    header={["Status", "ID", "Start at", "Croncat hash", "Creator", "Trigger gas", "Multicalls"]}
                    rows={Object.values(data ?? {})
                        .map(jobTableRowRender)
                        .reverse()}
                />
            </Scrollable>
        </Tile>
    );
};
