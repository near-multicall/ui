import { rpcProvider, view, tx } from "../wallet";
import { Big, toGas, dateToCron } from "../converter";

import type { FunctionCallAction as daoFunctionCallAction } from "./sputnik-dao";

const FACTORY_ADDRESS_SELECTOR: Record<string, string> = {
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

// Schema for Multicall jobs
type JobSchema = {
    croncat_hash: string;
    creator: string;
    bond: string; // string encoded number (u128)
    cadence: string;
    trigger_gas: string; // string encoded number (u64)
    croncat_budget: string; // string encoded number (u128)
    start_at: string; // string encoded number (u64)
    run_count: number;
    is_active: boolean;
    multicalls: MulticallArgs[];
};

type FunctionCall = {
    func: string;
    args: string; // base64 encoded JSON args
    gas: string; // string encoded number (u64)
    depo: string; // string encoded number (u128)
};

type BatchCall = {
    address: string;
    actions: FunctionCall[];
};

type MulticallArgs = {
    calls: BatchCall[][];
};

class MulticallConfigChanges {
    removeTokens: string[] = [];
    addTokens: string[] = [];
    jobBond: string = "";
    croncatManager: string = "";
}

class Multicall {
    static FACTORY_ADDRESS: string = FACTORY_ADDRESS_SELECTOR[window.NEAR_ENV];
    static CONTRACT_CODE_HASHES: string[] = CONTRACT_CODE_HASHES_SELECTOR[window.NEAR_ENV];

    address: string;
    admins: string[] = [];
    // only whitelisted tokens can be attached to multicalls or job activations.
    tokensWhitelist: string[] = [];
    // job bond amount must be attached as deposit when adding new jobs.
    // needs initialization, but start with "" because it's distinguishable from a real value (string encoded numbers).
    jobBond: string = "";
    // Multicall instance is ready when info (admins...) are fetched & assigned correctly.
    ready: boolean = false;

    constructor(multicallAddress: string) {
        this.address = multicallAddress;
    }

    // used to create and initialize a Multicall instance
    static async init(multicallAddress: string): Promise<Multicall> {
        // verify address is a Multicall instance, fetch its info and mark it ready
        const newMulticall = new Multicall(multicallAddress);
        const [isMulticall, admins, tokensWhitelist, jobBond] = await Promise.all([
            // on failure set isMulticall to false
            Multicall.isMulticall(multicallAddress).catch((err) => {
                return false;
            }),
            // on failure set admins list to be empty
            newMulticall.getAdmins().catch((err) => {
                return [];
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
    static async isMulticall(accountId: string): Promise<boolean> {
        const accountInfo: any = await rpcProvider.query({
            request_type: "view_account",
            finality: "final",
            account_id: accountId,
        });
        const codeHash: string = accountInfo.code_hash;
        return Multicall.CONTRACT_CODE_HASHES.includes(codeHash);
    }

    /**
     * Multicall's factory has an admin-controlled fee to be
     * paid upon creating a new multicall instance contract
     */
    static async getFactoryFee(): Promise<string> {
        return view(this.FACTORY_ADDRESS, "get_fee", {});
    }

    /**
     * Convert a series of config changes into an "actions" object that's compatible
     * with SputnikDAO (V2 & V3) function call proposal params.
     *
     * @param configDiff changes to current config of some multicall instance.
     * @returns actions that can be passed to JSON for DAO "add_proposal".
     */
    static configDiffToProposalActions(configDiff: MulticallConfigChanges): daoFunctionCallAction[] {
        const { removeTokens, addTokens, jobBond, croncatManager } = configDiff;
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
    async getAdmins(): Promise<string[]> {
        return view(this.address, "get_admins", {});
    }

    /**
     * get whitelisted tokens
     */
    async getWhitelistedTokens(): Promise<string[]> {
        return view(this.address, "get_tokens", {});
    }

    /**
     * get croncat manager address that was regitered on the multicall instance.
     */
    async getCroncatManager(): Promise<string> {
        return view(this.address, "get_croncat_manager", {});
    }

    /**
     * get whitelisted tokens
     */
    async getJobBond(): Promise<string> {
        return view(this.address, "get_job_bond", {});
    }

    /**
     * list all currently registered jobs
     */
    async getJobs(): Promise<{ id: number; job: JobSchema }[]> {
        return view(this.address, "get_jobs", {});
    }

    /**
     * Register a new job. Has to pay job bond.
     * TODO: Add logic for estimating totalBudget.
     *
     * @param multicalls Multicalls to execute. 1 multicall per tx.
     * @param triggerDate Execution date, in user's local time.
     * @param triggerGas Gas amount. Will be allocated for every tx in this job.
     * @param totalBudget Total fee to be paid to Croncat agents.
     * @returns
     */
    async addJob(
        multicalls: MulticallArgs[],
        triggerDate: Date, // Date of job execution
        triggerGas: string,
        totalBudget: string
    ): Promise<void> {
        // crontab in CronCat format. See: https://github.com/CronCats/Schedule
        const cadence: string = dateToCron(triggerDate);
        // timestamp as required by NEAR chain (UTC, in nanoseconds)
        const startAt: string = Big(triggerDate.getTime()).times("1000000").toFixed();
        return tx(
            this.address,
            "job_add",
            {
                job_multicalls: multicalls,
                job_cadence: cadence,
                job_trigger_gas: triggerGas,
                job_total_budget: totalBudget,
                job_start_at: startAt,
            },
            toGas("25"),
            this.jobBond
        );
    }
}

export { Multicall };
export type { MulticallArgs };
