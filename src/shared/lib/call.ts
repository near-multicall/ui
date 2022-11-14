import { Base64 } from "js-base64";

export type Call<TArgs = object> = {
    address: string;
    actions: Array<{
        func: string;
        args: TArgs;
        gas: string;
        depo: string;
    }>;
};

export class CallError extends Error {
    taskId: string;

    constructor(message: string, taskId: string) {
        super(message);
        this.taskId = taskId;
    }
}

/**
 * transform a Call into a string
 * @param call
 */
const toString = (call: Call): string => JSON.stringify(call, null, "  ");

/**
 * transform a Call into JSON, produces a deep copy of the Call object
 * @param call
 */
const toJson = (call: Call): object => JSON.parse(JSON.stringify(call));

/**
 * transform a Call into JSON, with the args field encoded as base64 string
 * @param call
 */
const toBase64 = (call: Call): object => ({
    address: call.address,
    actions: call.actions.map((action) => ({
        ...action,
        args: Base64.encode(JSON.stringify(action.args)),
    })),
});

export const fromCall = {
    toString,
    toJson,
    toBase64,
};
