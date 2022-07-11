import { tx, view } from "../wallet";
import { toGas } from "../converter";


const FACTORY_ADDRESS_SELECTOR: Record<string, string> = {
    "mainnet": "sputnik-dao.near",
    "testnet": "sputnikv2.testnet"
};
// base URLs for SputnikDAO reference UI. See: https://github.com/near-daos/sputnik-dao-2-ui-reference
const REFERENCE_UI_URL_SELECTOR: Record<string, string> = {
    "mainnet": "https://v2.sputnik.fund/#",
    "testnet": "https://testnet-v2.sputnik.fund/#"
};
// base URLs for AstroDAO UI. See: https://github.com/near-daos/astro-ui
const ASTRO_UI_URL_SELECTOR: Record<string, string> = {
    "mainnet": "https://app.astrodao.com",
    "testnet": "https://testnet.app.astrodao.com"
};
// what SputnikDAO UIs are supported? (P.S.: do NOT use const or string enum here)
enum SputnikUI {
    REFERENCE_UI,
    ASTRO_UI
}
// SputnikDAO contract mapping: version <-> code hashes
const CONTRACT_CODE_HASHES_SELECTOR: Record<string, string[]> = {
    "mainnet": [
        "8RMeZ5cXDap6TENxaJKtigRYf3n139iHmTRe8ZUNey6N", // v2.0
        "8jmhwSkNeAWCRqsr2KoD7d8BzDYorEz3a3iHuM9Gykrg", // v2.1 (with gas fix)
        "2Zof1Tyy4pMeJM48mDSi5ww2QQhTz97b9S8h6W6r4HnK" // v3.0
    ],
    "testnet": [
        "8RMeZ5cXDap6TENxaJKtigRYf3n139iHmTRe8ZUNey6N", // 2.0
        "8LN56HLNjvwtiNb6pRVNSTMtPgJYqGjAgkVSHRiK5Wfv", // v2.1 (with gas fix)
        "783vth3Fg8MBBGGFmRqrytQCWBpYzUcmHoCq4Mo8QqF5" // v3.0
    ]
}

// TODO: add method to Sputnik class to init the DAO (fetch & store policy, last proposal id etc...)
class SputnikDAO {

    static FACTORY_ADDRESS: string = FACTORY_ADDRESS_SELECTOR[window.NEAR_ENV];
    static REFERENCE_UI_BASE_URL: string = REFERENCE_UI_URL_SELECTOR[window.NEAR_ENV];
    static ASTRO_UI_BASE_URL: string = ASTRO_UI_URL_SELECTOR[window.NEAR_ENV];
    static CONTRACT_CODE_HASHES: string[] = CONTRACT_CODE_HASHES_SELECTOR[window.NEAR_ENV];
    
    DAO_ADDRESS: string;

    constructor(dao_address: string) {
        this.DAO_ADDRESS = dao_address;
    }

    /**
     * check of given accountId is a sputnikDAO instance.
     * uses code_hash of the contract deployed on accountId.
     * 
     * @param accountId 
     */
    static async isSputnikDAO (accountId: string): Promise<boolean> {
        const accountInfo: any = await window.near.connection.provider.query({
            request_type: "view_account",
            finality: "final",
            account_id: accountId
        });
        const codeHash: string = accountInfo.code_hash;
        return SputnikDAO.CONTRACT_CODE_HASHES.includes(codeHash);
    }


    async addProposal (args: object | Uint8Array, proposal_bond: string, ) {
        return tx(
            this.DAO_ADDRESS,
            "add_proposal",
            args,
            toGas("10"),  // 10 Tgas
            proposal_bond
        );
    }

    async actProposal (proposal_id: number, proposal_action: string) {
        return tx(
            this.DAO_ADDRESS,
            "act_proposal",
            { id: proposal_id, action: proposal_action },
            toGas("200"),  // 200 Tgas
            "0"
        );
    }

    async getProposals (args: {from_index: number, limit: number}): Promise<object[]> {
        return view(this.DAO_ADDRESS, "get_proposals", args);
    }

    async getProposal (proposal_id: number): Promise<object> {
        return view(this.DAO_ADDRESS, "get_proposal", { id: proposal_id });
    }

    async getLastProposalId (): Promise<number> {
        return view(this.DAO_ADDRESS, "get_last_proposal_id", {});
    }

    async getPolicy (): Promise<object> {
        return view(this.DAO_ADDRESS, "get_policy", {});
    }

    // get base URL for UI of choice
    static getUiBaseUrl (ui: SputnikUI): string {
        let base_url: string = "";
        // exit if UI not supported
        if ( !(ui in SputnikUI) ) return base_url;
        // We have a supported UI
        switch (ui) {
            case SputnikUI.REFERENCE_UI:
                base_url = this.REFERENCE_UI_BASE_URL;
                break;
            case SputnikUI.ASTRO_UI:
                base_url = this.ASTRO_UI_BASE_URL;
                break;
            default: break;
        }

        return base_url;
    }

    // get DAO page URL on UI of choice
    getDaoUrl (ui: SputnikUI): string {
        // exit if UI not supported
        if ( !(ui in SputnikUI) ) return "";
        // we have a supported UI
        const base_url: string = SputnikDAO.getUiBaseUrl(ui);
        let dao_path: string = "";
        // We have a supported UI
        switch (ui) {
            case SputnikUI.REFERENCE_UI:
                dao_path = `${this.DAO_ADDRESS}`;
                break;
            case SputnikUI.ASTRO_UI:
                dao_path = `dao/${this.DAO_ADDRESS}`;
                break;
            default: break;
        }
        return `${base_url}/${dao_path}`;
    }

    // get proposal page URL on UI of choice
    getProposalUrl (ui: SputnikUI, proposal_id: string): string {
        // exit if UI not supported
        if ( !(ui in SputnikUI) ) return "";
        // we have a supported UI
        const dao_url: string = this.getDaoUrl(ui);
        let proposal_path: string = "";
        // We have a supported UI
        switch (ui) {
            case SputnikUI.REFERENCE_UI:
                proposal_path = `${proposal_id}`;
                break;
            case SputnikUI.ASTRO_UI:
                proposal_path = `proposals/${this.DAO_ADDRESS}-${proposal_id}`;
                break;
            default: break;
        }
        return `${dao_url}/${proposal_path}`;
    }
}

export{
    SputnikDAO,
    SputnikUI
}
