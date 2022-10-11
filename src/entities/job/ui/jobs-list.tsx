import clsx from "clsx";
import { Scrollable, Table, Tile } from "../../../shared/ui/components";

import { type JobEntity } from "../config";
import { JobDataModel } from "../model/job-data";
import { jobDetailsTableRowRender } from "./job-details";
import "./jobs-list.scss";

interface JobsListProps extends JobEntity.Dependencies {}

const _JobsList = "JobsList";

export const JobsList = ({ className, contracts }: JobsListProps) => {
    const { data, loading } = JobDataModel.useAllJobsFrom(contracts);

    return (
        <Tile className={clsx(_JobsList, className)}>
            <h1 className="title">All jobs</h1>

            {data && (
                <Scrollable>
                    <Table
                        className={`${_JobsList}-body`}
                        displayMode="compact"
                        header={["Status", "ID", "Start at", "Croncat hash", "Creator", "Trigger gas", "Multicalls"]}
                        rows={Object.values(data).map(jobDetailsTableRowRender)}
                    />
                </Scrollable>
            )}

            {loading && <div className="loader" />}
        </Tile>
    );
};
