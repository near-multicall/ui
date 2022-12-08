import clsx from "clsx";

import { Scrollable, Table, Tile } from "../../../shared/ui/design";
import { JobInfoModel } from "../model/job-info";
import { Entity } from "../module-context";

import { jobAsTableRow } from "./job";
import "./jobs-table.scss";

interface JobsTableProps extends Entity.Inputs {}

const _JobsTable = "JobsTable";

export const JobsTable = ({ className, adapters }: JobsTableProps) => {
    const { data, error, loading } = JobInfoModel.useAllEntries(adapters),
        items = Object.values(data ?? {});

    return (
        <Tile
            classes={{ root: clsx(_JobsTable, className) }}
            heading="All jobs"
            noData={data !== null && items.length === 0}
            {...{ error, loading }}
        >
            <Scrollable>
                <Table
                    RowProps={{ withTitle: true }}
                    className={`${_JobsTable}-body`}
                    displayMode="compact"
                    header={["Status", "ID", "Start at", "Croncat hash", "Creator", "Trigger gas", "Multicalls"]}
                    rows={items.map(jobAsTableRow).reverse()}
                />
            </Scrollable>
        </Tile>
    );
};
