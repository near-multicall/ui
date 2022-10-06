import { cronToDate } from "../../../shared/lib/converter";
import { Tile, Scrollable, Table } from "../../../shared/ui/components";
import { JobDataModel } from "../model/job-data";
import { Dependencies } from "../config";

interface JobsListProps extends Dependencies {}

export const JobsList = ({ className, contracts }: JobsListProps) => {
    const { data, loading } = JobDataModel.useAllJobsFrom(contracts);

    return (
        <Tile {...{ className }}>
            <h1 className="title">Jobs</h1>

            {data && (
                <Scrollable>
                    <Table
                        displayMode="compact"
                        header={[
                            "Active status",
                            "Start at",
                            "Croncat hash",
                            "Creator",
                            "Trigger gas",
                            "Run count",
                            "Multicalls",
                        ]}
                        rows={data.map(({ job }) => [
                            job.is_active ? "Active" : "Inactive",
                            cronToDate(job.cadence).toLocaleString(),
                            job.croncat_hash,
                            job.creator,
                            job.trigger_gas,
                            job.run_count,
                            <pre>{JSON.stringify(job.multicalls, null, " ")}</pre>,
                        ])}
                    />
                </Scrollable>
            )}

            {loading && <div className="loader" />}
        </Tile>
    );
};
