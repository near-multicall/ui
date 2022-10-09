import { cronToDate, toTGas } from "../../../shared/lib/converter";
import { DataInspector, Scrollable, Table, Tile } from "../../../shared/ui/components";
import { JobDataModel } from "../model/job-data";
import { JobEntity } from "../config";

import "./jobs-list.scss";

interface JobsListProps extends JobEntity.dependencies {}

const _JobsList = "JobsList";

export const JobsList = ({ className, contracts }: JobsListProps) => {
    const { data, loading } = JobDataModel.useAllJobsFrom(contracts);

    return (
        <Tile {...{ className }}>
            <h1 className="title">All jobs</h1>

            {data && (
                <Scrollable>
                    <Table
                        className={_JobsList}
                        displayMode="compact"
                        header={["Status", "ID", "Start at", "Croncat hash", "Creator", "Trigger gas", "Multicalls"]}
                        rows={Object.values(data).map(({ id, job }) => [
                            job.status,
                            id,
                            cronToDate(job.cadence).toLocaleString(),
                            job.croncat_hash.length === 0 ? <i>none</i> : job.croncat_hash,
                            job.creator,
                            `${toTGas(job.trigger_gas)} Tgas`,

                            <DataInspector
                                classes={{ label: `${_JobsList}-dataInspector-label` }}
                                data={job.multicalls}
                                expandLevel={1}
                            />,
                        ])}
                    />
                </Scrollable>
            )}

            {loading && <div className="loader" />}
        </Tile>
    );
};
