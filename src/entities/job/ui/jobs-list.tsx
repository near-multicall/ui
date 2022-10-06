import { Tile, Scrollable, Table } from "../../../shared/ui/components";
import { Dependencies } from "../config";
import { JobDataModel } from "../model/job-data";

const _Job = ({ data: { croncat_hash, is_active, ...data } }: { data: JobData }) => (
    <div
        className="JobsList-item"
        key={croncat_hash}
    >
        {is_active ? <PauseOutlined /> : <PlayArrowOutlined />}
        <pre>{JSON.stringify(data, null, "  ")}</pre>
    </div>
);

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
                        header={["Active status", "Croncat hash", "Creator", "Trigger gas", "Run count", "Multicalls"]}
                        rows={data.map(({ id, job }) => [
                            job.is_active ? "Active" : "Inactive",
                            job.croncat_hash,
                            job.creator,
                            job.trigger_gas,
                            job.run_count,
                            JSON.stringify(job.multicalls, null, "  "),
                        ])}
                    />
                </Scrollable>
            )}

            {loading && <div className="loader" />}
        </Tile>
    );
};
