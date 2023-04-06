import { Base64 } from "js-base64";
import { JobData } from "./job.model";

export class JobLib {
    /**
     * Decodes base64-encoded arguments of for every multicall's FunctionCall
     *	and returns a new data structure with encoded version replaced with decoded one.
     *
     * @returns Updated job data structure.
     */
    public static readonly toDecoded = ({ id, status, job }: JobData): JobData => ({
        id,
        status,

        job: {
            ...job,

            multicalls: job.multicalls.map((multicall) => ({
                ...multicall,

                calls: multicall.calls.map((batchCalls) =>
                    batchCalls.map((batchCall) => ({
                        ...batchCall,

                        actions: batchCall.actions.map((action) => ({
                            ...action,

                            args: JSON.parse(Base64.decode(action.args)),
                        })),
                    }))
                ),
            })),
        },
    });
}
