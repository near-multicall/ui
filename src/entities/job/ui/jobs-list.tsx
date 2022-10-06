import { cronToDate } from "../../../shared/lib/converter";
import { Tile, Scrollable, Table } from "../../../shared/ui/components";
import { JobDataModel } from "../model/job-data";
import { Dependencies } from "../config";

interface JobsListProps extends Dependencies {
    elementClickHandler: (id: number) => void;
}

export const JobsList = ({ className, contracts, elementClickHandler }: JobsListProps) => {
    const { data, loading } = JobDataModel.useAllJobsFrom(contracts);

    return (
        <Tile {...{ className }}>
            <h1 className="title">All jobs</h1>

            {data && (
                <Scrollable>
                    <Table
                        displayMode="compact"
                        header={[
                            "Active status",
                            "ID",
                            "Start at",
                            "Croncat hash",
                            "Creator",
                            "Trigger gas",
                            "Run count",
                            "Multicalls",
                        ]}
                        rows={Object.values(data).map(({ id, job }) => [
                            job.is_active ? "Active" : "Inactive",
                            id,
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
