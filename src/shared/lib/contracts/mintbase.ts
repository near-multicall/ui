import { view, viewAccount } from "../wallet";
import { toGas, Big } from "../converter";
import { STORAGE } from "../persistent";
import { Base64 } from "js-base64";
import { FungibleToken } from "../standards/fungibleToken";

import type { MulticallArgs } from "./multicall";
import type { Tx } from "../wallet";
import { args } from "../args/args";

const FACTORY_ADDRESS_SELECTOR: Record<string, string> = {
    mainnet: "mintbase1.near",
    testnet: "mintspace2.testnet",
};
// base URLs for Mintbase UI
const UI_URL_SELECTOR: Record<string, string> = {
    mainnet: "https://www.mintbase.io",
    testnet: "https://testnet.mintbase.io",
};

const BASE_URI_ARWEAVE = "https://arweave.net";

class MintbaseStore {
    static FACTORY_ADDRESS: string = FACTORY_ADDRESS_SELECTOR[window.NEAR_ENV];
    static UI_BASE_URL: string = UI_URL_SELECTOR[window.NEAR_ENV];

    address: string;
    // DAO instance is ready when info (policy...) are fetched & assigned correctly
    ready: boolean = false;

    // shouldn't be used directly, use init() instead
    constructor(daoAddress: string) {
        this.address = daoAddress;
    }

    // create and initialize a Mintbase store instance
    static async init(daoAddress: string): Promise<MintbaseStore> {
        // verify address is a SputnikDAO, fetch DAO info and mark it ready
        const newStore = new MintbaseStore(daoAddress);
        const [isStore] = await Promise.all([
            // on failure set isDAO to false
            MintbaseStore.isMintbaseStore(daoAddress).catch(() => false),
        ]);
        // set DAO to ready
        if (isStore === true) {
            newStore.ready = true;
        }
        return newStore;
    }

    /**
     * check of given storeId is a Mintbase store.
     *
     * @param storeId
     */
    static async isMintbaseStore(storeId: string): Promise<boolean> {
        return MintbaseStore.checkContainsStore(storeId);
    }

    static async checkContainsStore(storeId: string): Promise<boolean> {
        return view(MintbaseStore.FACTORY_ADDRESS, "check_contains_store", { store_id: storeId });
    }

    static async getFactoryFee(): Promise<string> {
        return view(MintbaseStore.FACTORY_ADDRESS, "get_factory_fee", {});
    }

    async listMinters(): Promise<string[]> {
        return view(this.address, "list_minters", {});
    }

    // TODO: query store owner
}

export { MintbaseStore, BASE_URI_ARWEAVE };
