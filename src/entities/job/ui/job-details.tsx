import clsx from "clsx";

import { JobData } from "../../../shared/lib/contracts/multicall";
import { Tile } from "../../../shared/ui/components";
import { Dependencies } from "../config";

interface JobDetailsProps extends Pick<Dependencies, "className"> {
    id: JobData["id"] | null;
}

const _JobDetails = "JobDetails";

export const JobDetails = ({ className, id }: JobDetailsProps) => {
    return (
        <Tile className={clsx(_JobDetails, className)}>
            <h1 className="title">Job details</h1>
        </Tile>
    );
};
