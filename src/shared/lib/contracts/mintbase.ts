import { view, rpcProvider } from "../wallet";

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

type StoreInfo = {
    owner: string;
    minted: number;
    burned: number;
    approved: number;
    allow_moves: boolean;
};

class MintbaseStore {
    static FACTORY_ADDRESS: string = FACTORY_ADDRESS_SELECTOR[window.NEAR_ENV];
    static UI_BASE_URL: string = UI_URL_SELECTOR[window.NEAR_ENV];

    address: string;
    // initialize with invalid values
    info: StoreInfo = { owner: "", minted: -1, burned: -1, approved: -1, allow_moves: true };
    // DAO instance is ready when info (policy...) are fetched & assigned correctly
    ready: boolean = false;

    // shouldn't be used directly, use init() instead
    constructor(daoAddress: string) {
        this.address = daoAddress;
    }

    // create and initialize a Mintbase store instance
    static async init(daoAddress: string): Promise<MintbaseStore> {
        // verify address is a Mintbase store, and fetch its info to mark it ready
        const newStore = new MintbaseStore(daoAddress);
        const [isStore, storeInfo] = await Promise.all([
            // on failure set isStore to false
            MintbaseStore.isMintbaseStore(daoAddress).catch(() => false),
            newStore.getInfo(),
        ]);
        // set Store to ready
        if (isStore === true && storeInfo.owner !== "") {
            newStore.ready = true;
            newStore.info = storeInfo;
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

    /**
     * get store information. The contract method does not return the result
     * but logs it instead, so we need to use RPC directly.
     *
     * @returns
     */
    async getInfo(): Promise<StoreInfo> {
        const logs: string[] = (
            await rpcProvider.query<{
                block_hash: string;
                block_height: number;
                logs: string[];
                result: number[];
            }>({
                request_type: "call_function",
                finality: "final",
                account_id: this.address,
                method_name: "get_info",
                args_base64: "e30=", // base64 encoding of "{}"
            })
        ).logs;
        // extract store info from logs
        return {
            owner: logs[0].split("owner: ")[1],
            minted: JSON.parse(logs[1].split("minted: ")[1]),
            burned: JSON.parse(logs[1].split("burned: ")[1]),
            approved: JSON.parse(logs[1].split("approved: ")[1]),
            allow_moves: JSON.parse(logs[1].split("allow_moves: ")[1]),
        };
    }

    async listMinters(): Promise<string[]> {
        return view(this.address, "list_minters", {});
    }

    // TODO: query store owner
}

export { MintbaseStore, BASE_URI_ARWEAVE };
export type { StoreInfo };
