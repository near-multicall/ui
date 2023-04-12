import { args } from "../args/args";
import { Big, toGas, dateToCron, toYocto } from "../converter";
import { viewAccount, viewState, view, Tx } from "../wallet";

import { FunctionCallAction as daoFunctionCallAction, SputnikDAO } from "./sputnik-dao";

const FACTORY_ADDRESS_SELECTOR: Record<string, AccountId> = {
    mainnet: "v1.multicall.near",
    testnet: "v1_03.multicall.testnet",
};

// Multicall contract mapping: version <-> code hashes
const CONTRACT_CODE_HASHES_SELECTOR: Record<string, string[]> = {
    mainnet: [
        "6Em7E4Zs7d9oQkZSkMZ2CQuT2Wem3gPSpqDJ4VwFM79f", // v1
    ],
    testnet: [
        "6Em7E4Zs7d9oQkZSkMZ2CQuT2Wem3gPSpqDJ4VwFM79f", // v1_03
    ],
};

// Storage key of job count used by the contract
const KEY_JOB_COUNT: string = "g";

type JobData = {
    id: number;

    /**
     * Job status is:
     * - Inactive: This is the initial state
     * - Active: job is active, but not triggered yet.
     * - Running: job is active, and was triggered at least once.
     * - Expired: job not active, and execution moment is in the past.
     * - Finished: job finished running and was deleted (we have a mechanism similar to garbage collection)
     * - Deleted: job was deleted without finishing execution
     */
    status: "Inactive" | "Active" | "Running" | "Finished" | "Deleted" | "Expired" | "Unknown";

    /**
     * Job properties
     */
    job: {
        croncat_hash: string;
        creator: AccountId;
        bond: U128String;
        cadence: string;
        trigger_gas: U64String;
        croncat_budget: U128String;
        start_at: U64String;
        run_count: number;
        is_active: boolean;
        multicalls: MulticallArgs[];
    };
};

type JobDataNoStatus = Omit<JobData, "status">;

type FunctionCall = {
    func: string;
    args: Base64String;
    gas: U64String;
    depo: U128String;
};

type BatchCall = {
    address: AccountId;
    actions: FunctionCall[];
};

type MulticallArgs = {
    calls: BatchCall[][];
};

class Multicall {
    static FACTORY_ADDRESS: AccountId = FACTORY_ADDRESS_SELECTOR[window.NEAR_ENV];
    static CONTRACT_CODE_HASHES: AccountId[] = CONTRACT_CODE_HASHES_SELECTOR[window.NEAR_ENV];

    /**
     * 0.025 NEAR is the min required by croncat for a non-recurring task. Assume trigger of 270 Tgas and 0 NEAR.
     */
    static CRONCAT_FEE: U128String = toYocto("0.0275");

    address: AccountId;

    admins: AccountId[] = [];
    croncatManager: AccountId = "";

    /**
     * Only whitelisted tokens can be attached to multicalls or job activations.
     */
    tokensWhitelist: AccountId[] = [];

    /**
     * Job bond amount must be attached as deposit when adding new jobs.
     * Needs initialization, but start with "" because it's distinguishable from a real value (string encoded numbers).
     */
    jobBond: U128String = "";

    /**
     * Multicall instance is ready when info (admins...) are fetched & assigned correctly.
     */
    ready: boolean = false;

    constructor(accountId: AccountId) {
        this.address = accountId;
    }

    // used to create and initialize a Multicall instance
    static async init(accountId: AccountId): Promise<Multicall> {
        // verify address is a Multicall instance, fetch its info and mark it ready
        const multicallInstance = new Multicall(accountId);
        const [isMulticall, admins, croncatManager, tokensWhitelist, jobBond] = await Promise.all([
            // on failure set isMulticall to false
            Multicall.isMulticall(accountId).catch((err) => {
                return false;
            }),
            // on failure set admins list to be empty
            multicallInstance.getAdmins().catch((err) => {
                return [];
            }),
            //on failure set manager list to be empty
            multicallInstance.getCroncatManager().catch((err) => {
                return "";
            }),
            // on failure set tokens whitelist to be empty
            multicallInstance.getWhitelistedTokens().catch((err) => {
                return [];
            }),
            // on failure set job bond to ""
            multicallInstance.getJobBond().catch((err) => {
                return "";
            }),
        ]);

        multicallInstance.admins = admins;
        multicallInstance.croncatManager = croncatManager;
        multicallInstance.tokensWhitelist = tokensWhitelist;
        multicallInstance.jobBond = jobBond;
        // set ready to true if address is a Multicall instance and it has at least 1 admin.
        if (isMulticall === true && multicallInstance.admins.length >= 1) {
            multicallInstance.ready = true;
        }
        return multicallInstance;
    }

    /**
     * check of given accountId is a multicall instance.
     * uses code_hash of the contract deployed on accountId.
     *
     * @param accountId
     */
    static async isMulticall(accountId: AccountId): Promise<boolean> {
        const accountInfo = await viewAccount(accountId);
        const codeHash: string = accountInfo.code_hash;
        return Multicall.CONTRACT_CODE_HASHES.includes(codeHash);
    }

    /**
     * Multicall's factory has an admin-controlled fee to be
     * paid upon creating a new multicall instance contract
     */
    static async getFactoryFee(): Promise<U128String> {
        return view(this.FACTORY_ADDRESS, "get_fee", {});
    }

    /**
     * Convert a series of config changes into an "actions" object that's compatible
     * with SputnikDAO (V2 & V3) function call proposal params.
     *
     * @param configDiff changes to current config of some multicall instance.
     * @returns actions that can be passed to JSON for DAO "add_proposal".
     */
    static configDiffToProposalActions({
        addTokens = [],
        jobBond = "",
        removeTokens = [],
    }: {
        addTokens: Multicall["tokensWhitelist"];
        jobBond: Multicall["jobBond"];
        removeTokens: Multicall["tokensWhitelist"];
    }): daoFunctionCallAction[] {
        const actions: daoFunctionCallAction[] = [];

        // action: change amount of job bond
        if (jobBond !== "") {
            actions.push({
                method_name: "set_job_bond",
                args: { amount: jobBond },
                deposit: "1", // 1 yocto
                gas: toGas("10"), // 10 Tgas
            });
        }
        // action: remove tokens from whitelist
        if (removeTokens.length > 0) {
            actions.push({
                method_name: "tokens_remove",
                args: { addresses: removeTokens },
                deposit: "1", // 1 yocto
                gas: toGas("20"), // 20 Tgas
            });
        }
        // action: add tokens to whitelist
        if (addTokens.length > 0) {
            actions.push({
                method_name: "tokens_add",
                args: { addresses: addTokens },
                deposit: "1", // 1 yocto
                gas: toGas("20"), // 20 Tgas
            });
        }

        return actions;
    }

    /**
     * get list of admins
     */
    async getAdmins(): Promise<AccountId[]> {
        return view(this.address, "get_admins", {});
    }

    static getInstanceAddress = (spawnerAccountId: AccountId): Multicall["address"] =>
        args
            .string()
            .ensure()
            .intoBaseAddress()
            .append("." + Multicall.FACTORY_ADDRESS)
            .cast(spawnerAccountId);

    static getSputnikDAOAddress = (instanceAccountId: AccountId): SputnikDAO["address"] =>
        args
            .string()
            .ensure()
            .intoBaseAddress()
            .append("." + SputnikDAO.FACTORY_ADDRESS)
            .cast(instanceAccountId);

    /**
     * get whitelisted tokens
     */
    async getWhitelistedTokens(): Promise<AccountId[]> {
        return view(this.address, "get_tokens", {});
    }

    /**
     * get croncat manager address that was registered on the multicall instance.
     */
    async getCroncatManager(): Promise<AccountId> {
        return view(this.address, "get_croncat_manager", {});
    }

    /**
     * get job bond
     */
    async getJobBond(): Promise<U128String> {
        return view(this.address, "get_job_bond", {});
    }

    /**
     * fetch jobs from our indexer API. Supports pagination.
     * @param start
     * @param end
     * @returns
     */
    async apiGetJobs(start: number = 0, end: number = 1_000_000): Promise<JobDataNoStatus[]> {
        const daoAddr = this.address.replace(Multicall.FACTORY_ADDRESS, SputnikDAO.FACTORY_ADDRESS);
        switch (window.NEAR_ENV) {
            case "mainnet":
                return (await fetch(`https://api.multicall.app/jobs/${daoAddr}?start=${start}&end=${end}`)).json();
            case "testnet":
                // we don't run a Testnet indexer now, so we just fetch on-chain jobs
                return view(this.address, "get_jobs", {});
            default:
                return [];
        }
    }

    /**
     * list all currently registered jobs
     */
    async getJobs(): Promise<JobData[]> {
        const [chainData, apiData]: [JobDataNoStatus[], JobDataNoStatus[]] = await Promise.all([
            view(this.address, "get_jobs", {}),
            this.apiGetJobs(),
        ]);

        // Map is better for testing membership.
        const chainJobs = new Map(chainData.map((i) => [i.id, i]));

        // API has all jobs, but we prioritize job objects from the chain, just in case.
        const result: JobData[] = apiData.map(({ id, job }) => {
            if (chainJobs.has(id)) {
                const { job: jobInfo } = chainJobs.get(id)!;
                // assign a status to the job
                let status: JobData["status"];
                if (jobInfo.is_active) {
                    if (jobInfo.run_count > -1) status = "Running";
                    else status = "Active";
                } else {
                    // Date.now() returns timestamp in milliseconds, we use nanoseconds
                    const currentTime = Big(Date.now()).times("1000000");
                    const jobTime = jobInfo.start_at;
                    if (currentTime.gt(jobTime)) status = "Expired";
                    else status = "Inactive";
                }
                return {
                    id,
                    status,
                    job: jobInfo,
                };
            } else {
                // assign a status to the job
                const status = job.is_active ? "Finished" : "Deleted";
                return {
                    id,
                    status,
                    job,
                };
            }
        });
        return result;
    }

    /**
     * get current value of jobs counter. Contract doesn't have a getter method
     * so we query contract state using RPC.
     */
    async getJobCount(): Promise<number> {
        const state = await viewState(this.address, KEY_JOB_COUNT);
        // The counter is added to storage when the 1st job is created.
        const jobCount = state.length > 0 ? parseInt(state[0].value) : 0;
        return jobCount;
    }

    /**
     * Register a new job. Has to pay job bond.
     *
     * @param multicalls Multicalls to execute. 1 multicall per tx.
     * @param triggerDate Execution date, in user's local time.
     * @param triggerGas Gas amount. Will be allocated for every tx in this job.
     * @returns
     */
    // TODO: currently budget is hard-coded for jobs with 1 multicall
    async addJob(multicalls: MulticallArgs[], triggerDate: Date, triggerGas: U64String): Promise<Tx> {
        // crontab in CronCat format. See: https://github.com/CronCats/Schedule
        const cadence: string = dateToCron(triggerDate);
        // timestamp as required by NEAR chain (UTC, in nanoseconds)
        const startAt: string = Big(triggerDate.getTime()).times("1000000").toFixed();
        return {
            receiverId: this.address,
            actions: [
                {
                    type: "FunctionCall",
                    params: {
                        methodName: "job_add",
                        args: {
                            job_multicalls: multicalls,
                            job_cadence: cadence,
                            job_trigger_gas: triggerGas,
                            job_total_budget: Multicall.CRONCAT_FEE,
                            job_start_at: startAt,
                        },
                        gas: toGas("25"),
                        deposit: this.jobBond,
                    },
                },
            ],
        };
    }
}

export { Multicall };
export type { JobData, MulticallArgs };
