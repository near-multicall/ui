import clsx from "clsx";

import { Scrollable, Table, Tile } from "../../../shared/ui/design";
import { JobModel, JobModelInputs } from "../model/job.model";

import { jobAsTableRow } from "./job.entry";
import "./job.entries.scss";

const _JobEntriesTable = "JobEntriesTable";

export interface JobEntriesTableProps extends JobModelInputs {
    className?: string;
}

export const JobEntriesTable = ({ className, ...modelInputs }: JobEntriesTableProps) => {
    const { data, error, loading } = JobModel.useAllEntriesState(modelInputs),
        items = Object.values(data ?? {});

    return (
        <Tile
            classes={{ root: clsx(_JobEntriesTable, className) }}
            heading="All jobs"
            noData={data !== null && items.length === 0}
            {...{ error, loading }}
        >
            <Scrollable>
                <Table
                    RowProps={{ withTitle: true }}
                    className={`${_JobEntriesTable}-body`}
                    displayMode="compact"
                    header={["Status", "ID", "Start at", "Croncat hash", "Creator", "Trigger gas", "Multicalls"]}
                    rows={items.map(jobAsTableRow).reverse()}
                />
            </Scrollable>
        </Tile>
    );
};
