import { tx, view, rpcProvider } from "../wallet";
import { toGas } from "../converter";
import { ArgsAccount } from "../args";

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
    ],
};

// Define structure of a SputnikDAO policy
type Policy = {
    // List of roles and permissions for them in the current policy.
    roles: any[];
    // Default vote policy. Used when given proposal kind doesn't have special policy.
    default_vote_policy: object;
    // Proposal bond. (u128 as a string)
    proposal_bond: string;
    // Expiration period for proposals in nanoseconds. (u64 as a string)
    proposal_period: string;
    // Bond for claiming a bounty. (u128 as a string)
    bounty_bond: string;
    // Period in which giving up on bounty is not punished. (u64 as a string)
    bounty_forgiveness_period: string;
};

enum ProposalKind {
    ChangeConfig = "config",
    ChangePolicy = "policy",
    AddMemberToRole = "add_member_to_role",
    RemoveMemberFromRole = "remove_member_from_role",
    FunctionCall = "call",
    UpgradeSelf = "upgrade_self",
    UpgradeRemote = "upgrade_remote",
    Transfer = "transfer",
    SetStakingContract = "set_vote_token",
    AddBounty = "add_bounty",
    BountyDone = "bounty_done",
    Vote = "vote",
    FactoryInfoUpdate = "factory_info_update",
    ChangePolicyAddOrUpdateRole = "policy_add_or_update_role",
    ChangePolicyRemoveRole = "policy_remove_role",
    ChangePolicyUpdateDefaultVotePolicy = "policy_update_default_vote_policy",
    ChangePolicyUpdateParameters = "policy_update_parameters",
}

enum ProposalAction {
    /// Action to add proposal. Used internally.
    AddProposal = "AddProposal",
    /// Action to remove given proposal. Used for immediate deletion in special cases.
    RemoveProposal = "RemoveProposal",
    /// Vote to approve given proposal or bounty.
    VoteApprove = "VoteApprove",
    /// Vote to reject given proposal or bounty.
    VoteReject = "VoteReject",
    /// Vote to remove given proposal or bounty (because it's spam).
    VoteRemove = "VoteRemove",
    /// Finalize proposal, called when it's expired to return the funds
    /// (or in the future can be used for early proposal closure).
    Finalize = "Finalize",
    /// Move a proposal to the hub to shift into another DAO.
    MoveToHub = "MoveToHub",
}

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
    constructor(dao_address: string) {
        this.address = dao_address;
    }

    // used to create and initialize a DAO instance
    static async init(dao_address: string): Promise<SputnikDAO> {
        // verify address is a SputnikDAO, fetch DAO info and mark it ready
        const newDAO = new SputnikDAO(dao_address);
        const [isDAO, daoPolicy, daoLastProposalId] = await Promise.all([
            // on failure set isDAO to false
            SputnikDAO.isSputnikDAO(dao_address).catch((err) => {
                return false;
            }),
            // on failure set policy to default policy (empty)
            newDAO.getPolicy().catch((err) => {
                return newDAO.policy;
            }),
            // on failure ste last proposal ID to default (-1)
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
        const accountInfo: any = await rpcProvider.query({
            request_type: "view_account",
            finality: "final",
            account_id: accountId,
        });
        const codeHash: string = accountInfo.code_hash;
        return SputnikDAO.CONTRACT_CODE_HASHES.includes(codeHash);
    }

    async addProposal(args: object | Uint8Array, proposal_bond: string) {
        return tx(
            this.address,
            "add_proposal",
            args,
            toGas("10"), // 10 Tgas
            proposal_bond
        );
    }

    async actProposal(proposal_id: number, proposal_action: string) {
        return tx(
            this.address,
            "act_proposal",
            { id: proposal_id, action: proposal_action },
            toGas("200"), // 200 Tgas
            "0"
        );
    }

    async getProposals(args: { from_index: number; limit: number }): Promise<object[]> {
        return view(this.address, "get_proposals", args);
    }

    async getProposal(proposal_id: number): Promise<object> {
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
    getProposalUrl(ui: SputnikUI, proposal_id: string): string {
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
        if (ArgsAccount.isValid(daoAddr) && propId >= 0) {
            return { dao: daoAddr, proposalId: propId };
        }
        // outputs invalid
        else {
            return;
        }
    }

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
                return proposalKind === "*" || proposalKind === givenProposalKind;
            });
        const canDoAction: boolean = proposalKindPermissions?.some((permission) => {
            const [proposalKind, action] = permission.split(":");
            return action === "*" || action === givenAction;
        });

        return canDoAction;
    }
}

export { SputnikDAO, SputnikUI, ProposalKind, ProposalAction };
