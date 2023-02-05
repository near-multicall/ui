import { Base64 } from "js-base64";
import { Job } from "../context";

/**
 * Decodes base64-encoded arguments of for every multicall's FunctionCall
 *	and returns a new data structure with encoded version replaced with decoded one.
 *
 * @returns Updated job data structure.
 */
const jobToJobWithMulticallsDataDecoded = ({ id, status, job }: Job.Data): Job.Data => ({
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

export const JobNormalized = jobToJobWithMulticallsDataDecoded;
