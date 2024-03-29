// TODO: use token functions in proposeMulticallFT

import { view, viewAccount } from "../wallet";
import { toGas, Big } from "../converter";
import { STORAGE } from "../persistent";
import { Base64 } from "js-base64";
import { FungibleToken } from "../standards/fungibleToken";

import type { MulticallArgs } from "./multicall";
import type { Tx } from "../wallet";
import { args } from "../args/args";

const FACTORY_ADDRESS_SELECTOR: Record<string, string> = {
    mainnet: "sputnik-dao.near",
    testnet: "sputnikv2.testnet",
};
// base URLs for SputnikDAO reference UI. See: https://github.com/near-daos/sputnik-dao-2-ui-reference
const REFERENCE_UI_URL_SELECTOR: Record<string, string> = {
    mainnet: "https://v2.sputnik.fund/#",
    testnet: "https://testnet-v2.sputnik.fund/#",
};
// base URLs for AstroDAO UI. See: https://github.com/near-daos/astro-ui
const ASTRO_UI_URL_SELECTOR: Record<string, string> = {
    mainnet: "https://app.astrodao.com",
    testnet: "https://testnet.app.astrodao.com",
};
// what SputnikDAO UIs are supported? (P.S.: do NOT use const or string enum here)
enum SputnikUI {
    REFERENCE_UI,
    ASTRO_UI,
}
// SputnikDAO contract mapping: version <-> code hashes
const CONTRACT_CODE_HASHES_SELECTOR: Record<string, string[]> = {
    mainnet: [
        "8RMeZ5cXDap6TENxaJKtigRYf3n139iHmTRe8ZUNey6N", // v2.0
        "8jmhwSkNeAWCRqsr2KoD7d8BzDYorEz3a3iHuM9Gykrg", // v2.1 (with gas fix)
        "2Zof1Tyy4pMeJM48mDSi5ww2QQhTz97b9S8h6W6r4HnK", // v3.0
    ],
    testnet: [
        "ZGdM2TFdQpcXrxPxvq25514EViyi9xBSboetDiB3Uiq", // 2.0
        "8LN56HLNjvwtiNb6pRVNSTMtPgJYqGjAgkVSHRiK5Wfv", // v2.1 (with gas fix)
        "783vth3Fg8MBBGGFmRqrytQCWBpYzUcmHoCq4Mo8QqF5", // v3.0
        "xJQXQqHWiL4d88Df73Dq9JS1BevArkdxLkFWbUfxJMG", // v3.0?? (new factory re-deployment. See: https://explorer.testnet.near.org/transactions/GPu4qHL5X2qCw4bNJS4aJ9BQoBg8sJhujUfutfZ7b3yA )
    ],
};

type AstroApiDaoInfo = {
    createdAt: string;
    transactionHash: string;
    id: string;
    config: object;
    numberOfMembers: number;
    numberOfGroups: number;
    council: string[];
    accountIds: string[];
    status: string;
    activeProposalCount: number;
    totalProposalCount: number;
    totalDaoFunds: number;
    isCouncil: boolean;
};

// Define structure of a SputnikDAO policy
type Policy = {
    // List of roles and permissions for them in the current policy.
    roles: any[];
    // Default vote policy. Used when given proposal kind doesn't have special policy.
    default_vote_policy: object;
    // Proposal bond. (u128 as a string)
    proposal_bond: string;
    // Expiration period for proposals in nanoseconds. (u64)
    proposal_period: string;
    // Bond for claiming a bounty. (u128 as a string)
    bounty_bond: string;
    // Period in which giving up on bounty is not punished. (u64)
    bounty_forgiveness_period: string;
};

// structure returned by contract when fetching proposals.
type ProposalOutput = { id: number } & Proposal;
type Vote = "Approve" | "Reject" | "Remove";
type ProposalKind =
    | "ChangeConfig"
    | "ChangePolicy"
    | "AddMemberToRole"
    | "RemoveMemberFromRole"
    | "FunctionCall"
    | "UpgradeSelf"
    | "UpgradeRemote"
    | "Transfer"
    | "SetStakingContract"
    | "AddBounty"
    | "BountyDone"
    | "Vote"
    | "FactoryInfoUpdate"
    | "ChangePolicyAddOrUpdateRole"
    | "ChangePolicyRemoveRole"
    | "ChangePolicyUpdateDefaultVotePolicy"
    | "ChangePolicyUpdateParameters";

type ProposalAction =
    // Action to add proposal. Used internally.
    | "AddProposal"
    // Action to remove given proposal. Used for immediate deletion in special cases.
    | "RemoveProposal"
    // Vote to approve given proposal or bounty.
    | "VoteApprove"
    // Vote to reject given proposal or bounty.
    | "VoteReject"
    // Vote to remove given proposal or bounty (because it's spam).
    | "VoteRemove"
    // Finalize proposal, called when it's expired to return the funds
    // (or in the future can be used for early proposal closure).
    | "Finalize"
    // Move a proposal to the hub to shift into another DAO.
    | "MoveToHub";

// Define structure of a proposal
type Proposal = {
    // Original proposer.
    proposer: string;
    // Description of this proposal.
    description: string;
    // Kind of proposal with relevant information.
    kind: Record<ProposalKind, any>;
    // Current status of the proposal.
    status: ProposalStatus;
    // Count of votes per role per decision: yes / no / spam.
    vote_counts: Record<string, [number, number, number]>;
    // Map of who voted and how.
    votes: Record<string, Vote>;
    // Submission time (for voting period). (u64 as a string)
    submission_time: string;
};

const ProposalKindPolicyLabel: Record<ProposalKind, string> = {
    ChangeConfig: "config",
    ChangePolicy: "policy",
    AddMemberToRole: "add_member_to_role",
    RemoveMemberFromRole: "remove_member_from_role",
    FunctionCall: "call",
    UpgradeSelf: "upgrade_self",
    UpgradeRemote: "upgrade_remote",
    Transfer: "transfer",
    SetStakingContract: "set_vote_token",
    AddBounty: "add_bounty",
    BountyDone: "bounty_done",
    Vote: "vote",
    FactoryInfoUpdate: "factory_info_update",
    ChangePolicyAddOrUpdateRole: "policy_add_or_update_role",
    ChangePolicyRemoveRole: "policy_remove_role",
    ChangePolicyUpdateDefaultVotePolicy: "policy_update_default_vote_policy",
    ChangePolicyUpdateParameters: "policy_update_parameters",
};

// Status of a proposal.
enum ProposalStatus {
    InProgress = "InProgress",
    // If quorum voted yes, this proposal is successfully approved.
    Approved = "Approved",
    // If quorum voted no, this proposal is rejected. Bond is returned.
    Rejected = "Rejected",
    // If quorum voted to remove (e.g. spam), this proposal is rejected and bond is not returned.
    // Interfaces shouldn't show removed proposals.
    Removed = "Removed",
    // Expired after period of time.
    Expired = "Expired",
    // If proposal was moved to Hub or somewhere else.
    Moved = "Moved",
    // If proposal has failed when finalizing. Allowed to re-finalize again to either expire or approved.
    Failed = "Failed",
}

// SputnikDAO FunctionCall structure
type FunctionCall = {
    receiver_id: string;
    actions: FunctionCallAction[];
};

type FunctionCallAction = {
    method_name: string;
    args: object;
    deposit: string; // (u128 as a string)
    gas: string; // (u64 as a string)
};

class SputnikDAO {
    static FACTORY_ADDRESS: string = FACTORY_ADDRESS_SELECTOR[window.NEAR_ENV];
    static REFERENCE_UI_BASE_URL: string = REFERENCE_UI_URL_SELECTOR[window.NEAR_ENV];
    static ASTRO_UI_BASE_URL: string = ASTRO_UI_URL_SELECTOR[window.NEAR_ENV];
    static CONTRACT_CODE_HASHES: string[] = CONTRACT_CODE_HASHES_SELECTOR[window.NEAR_ENV];

    address: string;
    // needs initialization, but start with an empty policy
    policy: Policy = {
        roles: [],
        default_vote_policy: {},
        proposal_bond: "",
        proposal_period: "",
        bounty_bond: "",
        bounty_forgiveness_period: "",
    };
    // needs initialization, but start with -1 because it's distinguishable from a real ID ( >= 0 )
    lastProposalId: number = -1;
    // DAO instance is ready when info (policy...) are fetched & assigned correctly
    ready: boolean = false;

    // shouldn't be used directly, use init() instead
    constructor(daoAddress: string) {
        this.address = daoAddress;
    }

    // create and initialize a DAO instance
    static async init(daoAddress: string): Promise<SputnikDAO> {
        // verify address is a SputnikDAO, fetch DAO info and mark it ready
        const newDAO = new SputnikDAO(daoAddress);
        const [isDAO, daoPolicy, daoLastProposalId] = await Promise.all([
            // on failure set isDAO to false
            SputnikDAO.isSputnikDAO(daoAddress).catch((err) => {
                return false;
            }),
            // on failure set policy to default policy (empty)
            newDAO.getPolicy().catch((err) => {
                return newDAO.policy;
            }),
            // on failure set last proposal ID to default (-1)
            newDAO.getLastProposalId().catch((err) => {
                return newDAO.lastProposalId;
            }),
        ]);
        newDAO.policy = daoPolicy;
        newDAO.lastProposalId = daoLastProposalId;
        // set DAO to ready if address is a DAO and lastProposalID + policy got updated.
        if (isDAO === true && newDAO.lastProposalId >= 0 && newDAO.policy.roles.length >= 1) {
            newDAO.ready = true;
        }
        return newDAO;
    }

    /**
     * check of given accountId is a sputnikDAO instance.
     * uses code_hash of the contract deployed on accountId.
     *
     * @param accountId
     */
    static async isSputnikDAO(accountId: string): Promise<boolean> {
        const accountInfo = await viewAccount(accountId);
        const codeHash: string = accountInfo.code_hash;
        return SputnikDAO.CONTRACT_CODE_HASHES.includes(codeHash);
    }

    static async getUserDaosInfo(accountId: string): Promise<AstroApiDaoInfo[]> {
        const apiURL = `https://api.${
            window.NEAR_ENV === "mainnet" ? "" : "testnet."
        }app.astrodao.com/api/v1/daos/account-daos/${accountId}`;
        const response = await fetch(apiURL);
        const data: AstroApiDaoInfo[] = await response.json();

        return data;
    }

    async addProposal(args: object | Uint8Array): Promise<Tx> {
        return {
            receiverId: this.address,
            actions: [
                {
                    type: "FunctionCall",
                    params: {
                        methodName: "add_proposal",
                        args,
                        gas: toGas("50"), // 50 Tgas
                        deposit: this.policy.proposal_bond,
                    },
                },
            ],
        };
    }

    async actProposal(proposal_id: number, proposal_action: string): Promise<Tx> {
        return {
            receiverId: this.address,
            actions: [
                {
                    type: "FunctionCall",
                    params: {
                        methodName: "act_proposal",
                        args: { id: proposal_id, action: proposal_action },
                        gas: toGas("200"), // 200 Tgas,
                        deposit: "0",
                    },
                },
            ],
        };
    }

    async getProposals(args: { from_index: number; limit: number }): Promise<ProposalOutput[]> {
        return view(this.address, "get_proposals", args);
    }

    /**
     * Fetch proposal info from DAO contract
     */
    async getProposal(proposal_id: number): Promise<ProposalOutput> {
        return view(this.address, "get_proposal", { id: proposal_id });
    }

    async getLastProposalId(): Promise<number> {
        return view(this.address, "get_last_proposal_id", {});
    }

    async getPolicy(): Promise<Policy> {
        return view(this.address, "get_policy", {});
    }

    // get base URL for UI of choice
    static getUiBaseUrl(ui: SputnikUI): string {
        let base_url: string = "";
        // exit if UI not supported
        if (!(ui in SputnikUI)) return base_url;
        // We have a supported UI
        switch (ui) {
            case SputnikUI.REFERENCE_UI:
                base_url = this.REFERENCE_UI_BASE_URL;
                break;
            case SputnikUI.ASTRO_UI:
                base_url = this.ASTRO_UI_BASE_URL;
                break;
            default:
                break;
        }

        return base_url;
    }

    // get DAO page URL on UI of choice
    getDaoUrl(ui: SputnikUI): string {
        // exit if UI not supported
        if (!(ui in SputnikUI)) return "";
        // we have a supported UI
        const base_url: string = SputnikDAO.getUiBaseUrl(ui);
        let dao_path: string = "";
        // We have a supported UI
        switch (ui) {
            case SputnikUI.REFERENCE_UI:
                dao_path = `${this.address}`;
                break;
            case SputnikUI.ASTRO_UI:
                dao_path = `dao/${this.address}`;
                break;
            default:
                break;
        }
        return `${base_url}/${dao_path}`;
    }

    // get proposal page URL on UI of choice
    getProposalUrl(ui: SputnikUI, proposal_id: number): string {
        // exit if UI not supported
        if (!(ui in SputnikUI)) return "";
        // we have a supported UI
        const dao_url: string = this.getDaoUrl(ui);
        let proposal_path: string = "";
        // We have a supported UI
        switch (ui) {
            case SputnikUI.REFERENCE_UI:
                proposal_path = `${proposal_id}`;
                break;
            case SputnikUI.ASTRO_UI:
                proposal_path = `proposals/${this.address}-${proposal_id}`;
                break;
            default:
                break;
        }
        return `${dao_url}/${proposal_path}`;
    }

    // check if URL is for a proposal page on UI of choice
    static getInfoFromProposalUrl(url: string): { dao: string; proposalId: number } | undefined {
        // create URL object from url
        let urlObj: URL;
        try {
            urlObj = new URL(url);
        } catch (e) {
            // input string isn't a valid URL
            return;
        }

        // initialize with invalid values
        let daoAddr: string = "",
            propId: number = -1;
        // dextract info depending to Frontend type
        if (SputnikDAO.getUiBaseUrl(SputnikUI.ASTRO_UI) === urlObj.origin) {
            const path: string[] = urlObj.pathname.split("/");
            daoAddr = path[2];
            const propIdStr: string = path[4].split("-").pop() ?? "";
            propId = Number.isNaN(propIdStr) ? -1 : parseInt(propIdStr);
        } else if (SputnikDAO.getUiBaseUrl(SputnikUI.REFERENCE_UI) === urlObj.origin + "/#") {
            const path: string[] = urlObj.hash.split("/");
            daoAddr = path[1];
            const propIdStr: string = path[2];
            propId = Number.isNaN(propIdStr) ? -1 : parseInt(propIdStr);
        }
        // URL doesn't belong to a supported UI type
        else {
            return;
        }

        // check output validity: DAO address is valid NEAR address
        // and proposal ID is a positive number
        if (args.string().address().isValidSync(daoAddr) && propId >= 0) {
            return { dao: daoAddr, proposalId: propId };
        }
        // outputs invalid
        else {
            return;
        }
    }

    static isProposalURLValid = (urlString: string): boolean => Boolean(SputnikDAO.getInfoFromProposalUrl(urlString));

    // check if user can perform some action on some proposal kind
    checkUserPermission(userAddr: string, givenAction: ProposalAction, givenProposalKind: ProposalKind): boolean {
        if (this.ready === false) return false;

        // get all the user's permissions on the chosen proposal kind
        const proposalKindPermissions: string[] = this.policy.roles
            .filter((r) => r.kind === "Everyone" || r.kind.Group?.includes(userAddr))
            .map((r) => r.permissions)
            .flat()
            .filter((permission) => {
                const [proposalKind, action] = permission.split(":");
                return proposalKind === "*" || proposalKind === ProposalKindPolicyLabel[givenProposalKind];
            });
        const canDoAction: boolean = proposalKindPermissions?.some((permission) => {
            const [proposalKind, action] = permission.split(":");
            return action === "*" || action === givenAction;
        });

        return canDoAction;
    }

    // propose a generic function call to DAO.
    async proposeFunctionCall(desc: string, pTarget: string, pActions: FunctionCallAction[]): Promise<Tx> {
        const proposalArgs = {
            proposal: {
                description: desc,
                kind: {
                    FunctionCall: {
                        receiver_id: pTarget,
                        actions: pActions.map((action) => ({
                            ...action,
                            // base64 encode supplied action args
                            args: Base64.encode(JSON.stringify(action.args)),
                        })),
                    },
                },
            },
        };

        // return the add_proposal transaction
        return this.addProposal(proposalArgs);
    }

    /**
     * propose a multicall using args from LAYOUT
     *
     * @param {string} desc DAO proposal description
     * @param {MulticallArgs} multicallArgs input to the multicall function
     * @param {string} depo NEAR amount to be attached to multicall
     * @param {string} gas Gas amount dedicated to multicall execution
     */
    async proposeMulticall(desc: string, multicallArgs: MulticallArgs, depo: string, gas: string): Promise<Tx> {
        const { multicall } = STORAGE.addresses;

        const callActions: FunctionCallAction[] = [
            {
                method_name: "multicall",
                args: multicallArgs,
                deposit: `${depo}`,
                gas: `${gas}`,
            },
        ];

        // return the add_proposal transaction
        return this.proposeFunctionCall(desc, multicall, callActions);
    }

    /**
     * propose activating a multicall job
     *
     * @param {string} desc DAO proposal description
     * @param {number} jobId ID of job to be activated
     * @param {string} depo NEAR amount to be attached to job activation
     */
    async proposeJobActivation(desc: string, jobId: number, depo: string): Promise<Tx> {
        const { multicall } = STORAGE.addresses;

        const callActions: FunctionCallAction[] = [
            {
                method_name: "job_activate",
                args: { job_id: jobId },
                deposit: `${depo}`,
                gas: toGas("100"), // 100 Tgas
            },
        ];

        // return the add_proposal transaction
        return this.proposeFunctionCall(desc, multicall, callActions);
    }

    /**
     * propose multicall with attached FT using args from LAYOUT
     *
     * @param {string} desc DAO proposal description
     * @param {MulticallArgs} multicallArgs input to the multicall function
     * @param {string} gas gas for the multicall action
     * @param {string} tokenAddress attached FT address
     * @param {string} amount attached FT amount
     */
    async proposeMulticallFT(
        desc: string,
        multicallArgs: MulticallArgs,
        gas: string,
        tokenAddress: string,
        amount: string
    ): Promise<Tx> {
        const { multicall } = STORAGE.addresses;
        const token = new FungibleToken(tokenAddress);

        const actions: FunctionCallAction[] = [
            {
                method_name: "ft_transfer_call",
                args: {
                    receiver_id: multicall,
                    amount: amount,
                    msg: JSON.stringify({
                        function_id: "multicall",
                        args: Base64.encode(JSON.stringify(multicallArgs).toString()),
                    }).toString(),
                },
                deposit: "1", // nep-141: ft_transfer_call expects EXACTLY 1 yocto
                gas: gas,
            },
        ];

        // check if multicall has enough storage on Token
        const [storageBalance, storageBounds] = await Promise.all([
            // get storage balance of multicall on the token
            token.storageBalanceOf(multicall),
            // get storage balance bounds in case multicall has no storage on the token and it needs to be paid
            token.storageBalanceBounds(),
        ]);
        const totalStorageBalance = Big(storageBalance.total);
        const storageMinBound = Big(storageBounds.min);

        // if storage balance is less than minimum bound, add proposal action to pay for storage
        if (totalStorageBalance.lt(storageMinBound)) {
            // push to beginning of actions array. Has to execute before ft_transfer_call
            actions.unshift({
                method_name: "storage_deposit",
                args: { account_id: multicall },
                deposit: storageMinBound.sub(totalStorageBalance).toFixed(), // difference between current storage total and required minimum
                gas: toGas("5"), // 5 Tgas
            });
        }

        // return the add_proposal transaction
        return this.proposeFunctionCall(desc, tokenAddress, actions);
    }

    /**
     * propose multicall with attached FT using args from LAYOUT
     *
     * @param {string} desc DAO proposal description
     * @param {number} jobId ID of job to be activated
     * @param {string} tokenAddress attached FT address
     * @param {string} amount attached FT amount
     */
    async proposeJobActivationFT(desc: string, jobId: number, tokenAddress: string, amount: string): Promise<Tx> {
        const { multicall } = STORAGE.addresses;
        const token = new FungibleToken(tokenAddress);

        const actions: FunctionCallAction[] = [
            {
                method_name: "ft_transfer_call",
                args: {
                    receiver_id: multicall,
                    amount: amount,
                    msg: JSON.stringify({
                        function_id: "job_activate",
                        args: Base64.encode(JSON.stringify({ job_id: jobId }).toString()),
                    }).toString(),
                },
                deposit: "1", // nep-141: ft_transfer_call expects EXACTLY 1 yocto
                gas: toGas("150"), // 150 Tgas
            },
        ];

        // check if multicall has enough storage on Token
        const [storageBalance, storageBounds] = await Promise.all([
            // get storage balance of multicall on the token
            token.storageBalanceOf(multicall),
            // get storage balance bounds in case multicall has no storage on the token and it needs to be paid
            token.storageBalanceBounds(),
        ]);
        const totalStorageBalance = Big(storageBalance.total);
        const storageMinBound = Big(storageBounds.min);

        // if storage balance is less than minimum bound, add proposal action to pay for storage
        if (totalStorageBalance.lt(storageMinBound)) {
            // push to beginning of actions array. Has to execute before ft_transfer_call
            actions.unshift({
                method_name: "storage_deposit",
                args: { account_id: multicall },
                deposit: storageMinBound.sub(totalStorageBalance).toFixed(), // difference between current storage total and required minimum
                gas: toGas("5"), // 5 Tgas
            });
        }

        // return the add_proposal transaction
        return this.proposeFunctionCall(desc, tokenAddress, actions);
    }
}

export { SputnikDAO, SputnikUI, ProposalKindPolicyLabel, ProposalStatus };
export type { FunctionCall, FunctionCallAction, ProposalOutput, ProposalKind, ProposalAction };
