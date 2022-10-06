import clsx from "clsx";

import { JobData } from "../../../shared/lib/contracts/multicall";
import { Tile } from "../../../shared/ui/components";
import { Dependencies } from "../config";

interface JobInfoProps extends Pick<Dependencies, "className"> {
    id: JobData["id"] | null;
}

const _JobInfo = "JobInfo";

export const JobInfo = ({ className, id }: JobInfoProps) => {
    return (
        <Tile className={clsx(_JobInfo, className)}>
            <h1 className="title">Job info</h1>
        </Tile>
    );
};
