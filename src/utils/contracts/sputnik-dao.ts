import { tx, view } from "../wallet";


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
// what SputnikDAO UIs are supported?
const SUPPORTED_FRONTENDS: Record<string, boolean> = {
    "REFERENCE_UI": true,
    "ASTRO_UI": true
}


class SputnikDAO {

    static FACTORY_ADDRESS: string = FACTORY_ADDRESS_SELECTOR[window.NEAR_ENV];
    static REFERENCE_UI_BASE_URL: string = REFERENCE_UI_URL_SELECTOR[window.NEAR_ENV];
    static ASTRO_UI_BASE_URL: string = ASTRO_UI_URL_SELECTOR[window.NEAR_ENV];
    
    DAO_ADDRESS: string;

    constructor(dao_address: string) {
        this.DAO_ADDRESS = dao_address;
    }


    async add_proposal (args: object | Uint8Array, proposal_bond: string, ) {
        return tx(
            this.DAO_ADDRESS,
            "add_proposal",
            args,
            10_000_000_000_000,
            proposal_bond
        );
    }

    async act_proposal (proposal_id: number, proposal_action: string) {
        return tx(
            this.DAO_ADDRESS,
            "act_proposal",
            { id: proposal_id, action: proposal_action },
            200_000_000_000_000,
            "0"
        );
    }

    async get_proposals (args: {from_index: number, limit: number}): Promise<object[]> {
        return view(this.DAO_ADDRESS, "get_proposals", args);
    }

    async get_proposal (proposal_id: number): Promise<object> {
        return view(this.DAO_ADDRESS, "get_proposal", { id: proposal_id });
    }

    async get_last_proposal_id (): Promise<number> {
        return view(this.DAO_ADDRESS, "get_last_proposal_id", {});
    }

    async get_policy (): Promise<object> {
        return view(this.DAO_ADDRESS, "get_policy", {});
    }

    // get base URL for UI of choice
    static get_ui_base_url (ui: string): string {
        let base_url: string = "";
        // exit if UI not supported
        if ( !SUPPORTED_FRONTENDS[ui] ) return base_url;
        // We have a supported UI
        switch (ui) {
            case "REFERENCE_UI":
                base_url = this.REFERENCE_UI_BASE_URL;
                break;
            case "ASTRO_UI":
                base_url = this.ASTRO_UI_BASE_URL;
                break;
            default: break;
        }

        return base_url;
    }

    // get DAO page URL on UI of choice
    get_dao_url (ui: string): string {
        // exit if UI not supported
        if ( !SUPPORTED_FRONTENDS[ui] ) return "";
        // we have a supported UI
        const base_url: string = SputnikDAO.get_ui_base_url(ui);
        let dao_path: string = "";
        // We have a supported UI
        switch (ui) {
            case "REFERENCE_UI":
                dao_path = `${this.DAO_ADDRESS}`;
                break;
            case "ASTRO_UI":
                dao_path = `/dao/${this.DAO_ADDRESS}`;
                break;
            default: break;
        }
        return `${base_url}/${dao_path}`;
    }

    // get proposal page URL on UI of choice
    get_proposal_url (ui: string, proposal_id: string): string {
        // exit if UI not supported
        if ( !SUPPORTED_FRONTENDS[ui] ) return "";
        // we have a supported UI
        const dao_url: string = this.get_dao_url(ui);
        let proposal_path: string = "";
        // We have a supported UI
        switch (ui) {
            case "REFERENCE_UI":
                proposal_path = `${proposal_id}`;
                break;
            case "ASTRO_UI":
                proposal_path = `proposals/${this.DAO_ADDRESS}-${proposal_id}`;
                break;
            default: break;
        }
        return `${dao_url}/${proposal_path}`;
    }
}

export{
    SputnikDAO
}
