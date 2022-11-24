import { Big, toGas, dateToCron, toYocto } from "../converter";
import { AccountId, Base64String, BigString, U128String, U64String } from "../types";
import { type Tx, viewAccount, viewState, view } from "../wallet";

import type { FunctionCallAction as daoFunctionCallAction } from "./sputnik-dao";

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
     * Job properties
     */
    job: {
        croncat_hash: string;
        creator: AccountId;
        bond: U128String; // string encoded number (u128)
        cadence: string;
        trigger_gas: U64String; // string encoded number (u64)
        croncat_budget: U128String; // string encoded number (u128)
        start_at: U64String; // string encoded number (u64)
        run_count: number;
        is_active: boolean;
        multicalls: MulticallArgs[];
    };
};

type FunctionCall = {
    func: string;
    args: Base64String; // base64 encoded JSON args
    gas: U64String; // string encoded number (u64)
    depo: U128String; // string encoded number (u128)
};

type BatchCall = {
    address: AccountId;
    actions: FunctionCall[];
};

type MulticallArgs = {
    calls: BatchCall[][];
};

enum MulticallSettingsParamKey {
    croncatManager = "croncatManager",
    jobBond = "jobBond",
}

enum MulticallTokenWhitelistDiffKey {
    addTokens = "addTokens",
    removeTokens = "removeTokens",
}

type MulticallSettingsDiff = {
    [MulticallTokenWhitelistDiffKey.addTokens]: AccountId[];
    [MulticallSettingsParamKey.croncatManager]: AccountId;
    [MulticallSettingsParamKey.jobBond]: U128String;
    [MulticallTokenWhitelistDiffKey.removeTokens]: AccountId[];
};

class Multicall {
    static FACTORY_ADDRESS: AccountId = FACTORY_ADDRESS_SELECTOR[window.NEAR_ENV];
    static CONTRACT_CODE_HASHES: AccountId[] = CONTRACT_CODE_HASHES_SELECTOR[window.NEAR_ENV];
    // 0.025 NEAR is the min required by croncat for a non-recurring task. Assume trigger of 270 Tgas and 0 NEAR.
    static CRONCAT_FEE: BigString = toYocto("0.0275");

    address: AccountId;
    admins: AccountId[] = [];
    [MulticallSettingsParamKey.croncatManager]: AccountId = "";
    // only whitelisted tokens can be attached to multicalls or job activations.
    tokensWhitelist: AccountId[] = [];
    // job bond amount must be attached as deposit when adding new jobs.
    // needs initialization, but start with "" because it's distinguishable from a real value (string encoded numbers).
    [MulticallSettingsParamKey.jobBond]: U128String = "";
    // Multicall instance is ready when info (admins...) are fetched & assigned correctly.
    ready: boolean = false;

    constructor(multicallAddress: AccountId) {
        this.address = multicallAddress;
    }

    // used to create and initialize a Multicall instance
    static async init(multicallAddress: AccountId): Promise<Multicall> {
        // verify address is a Multicall instance, fetch its info and mark it ready
        const newMulticall = new Multicall(multicallAddress);
        const [isMulticall, admins, croncatManager, tokensWhitelist, jobBond] = await Promise.all([
            // on failure set isMulticall to false
            Multicall.isMulticall(multicallAddress).catch((err) => {
                return false;
            }),
            // on failure set admins list to be empty
            newMulticall.getAdmins().catch((err) => {
                return [];
            }),
            //on failure set manager list to be empty
            newMulticall.getCroncatManager().catch((err) => {
                return "";
            }),
            // on failure set tokens whitelist to be empty
            newMulticall.getWhitelistedTokens().catch((err) => {
                return [];
            }),
            // on failure set job bond to ""
            newMulticall.getJobBond().catch((err) => {
                return "";
            }),
        ]);

        newMulticall.admins = admins;
        newMulticall.croncatManager = croncatManager;
        newMulticall.tokensWhitelist = tokensWhitelist;
        newMulticall.jobBond = jobBond;
        // set ready to true if address is a Multicall instance and it has at least 1 admin.
        if (isMulticall === true && newMulticall.admins.length >= 1) {
            newMulticall.ready = true;
        }
        return newMulticall;
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
        removeTokens = [],
        addTokens = [],
        jobBond = "",
        croncatManager = "",
    }: MulticallSettingsDiff): daoFunctionCallAction[] {
        const actions: daoFunctionCallAction[] = [];

        // action: change croncat manager address
        if (croncatManager !== "") {
            actions.push({
                method_name: "set_croncat_manager",
                args: { address: croncatManager },
                deposit: "1", // 1 yocto
                gas: toGas("10"), // 10 Tgas
            });
        }
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
     * list all currently registered jobs
     */
    async getJobs(): Promise<JobData[]> {
        return view(this.address, "get_jobs", {});
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

export { Multicall, MulticallSettingsParamKey, MulticallTokenWhitelistDiffKey };
export type { JobData, MulticallArgs, MulticallSettingsDiff };
