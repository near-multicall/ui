import clsx from "clsx";

import { Scrollable, Table, Tile } from "../../../shared/ui/components";

import { type JobEntity } from "../config";
import { JobDataModel } from "../model/job-data";
import { jobDetailsTableRow } from "./job-details";
import "./jobs-list.scss";

interface JobsListProps extends JobEntity.Dependencies {}

const _JobsList = "JobsList";

export const JobsList = ({ className, contracts }: JobsListProps) => {
    const { data, error, loading } = JobDataModel.useAllJobsFrom(contracts);

    return (
        <Tile
            className={clsx(_JobsList, className)}
            heading="All jobs"
            noData={data !== null && Object.values(data).length === 0}
            {...{ error, loading }}
        >
            <Scrollable>
                <Table
                    className={`${_JobsList}-body`}
                    displayMode="compact"
                    header={["Status", "ID", "Start at", "Croncat hash", "Creator", "Trigger gas", "Multicalls"]}
                    rows={Object.values(data ?? {}).map(jobDetailsTableRow)}
                />
            </Scrollable>
        </Tile>
    );
};
