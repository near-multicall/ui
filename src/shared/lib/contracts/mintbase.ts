import { view, rpcProvider } from "../wallet";
import { args } from "../args/args";

const FACTORY_ADDRESS_SELECTOR: Record<string, string> = {
    mainnet: "mintbase1.near",
    testnet: "mintspace2.testnet",
};

const SIMPLE_MARKETPLACE_ADDRESS_SELECTOR: Record<string, string> = {
    mainnet: "simple.market.mintbase1.near",
    testnet: "market-v2-beta.mintspace2.testnet",
};

const API_URL_SELECTOR: Record<string, string> = {
    mainnet: "https://interop-mainnet.hasura.app/v1/graphql",
    testnet: "https://interop-testnet.hasura.app/v1/graphql",
};

// Used to fetch data from Mintbase GraphQL endpoints.
const API_KEY = "9af6e80e-d41b-44ee-9960-b6f1518e86a9";

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
    static SIMPLE_MARKETPLACE_ADDRESS: string = SIMPLE_MARKETPLACE_ADDRESS_SELECTOR[window.NEAR_ENV];
    static UI_BASE_URL: string = UI_URL_SELECTOR[window.NEAR_ENV];
    static API_URL: string = API_URL_SELECTOR[window.NEAR_ENV];

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

    /**
     * Check if a store exists
     *
     * @param storeId
     * @returns
     */
    static async checkContainsStore(storeId: string): Promise<boolean> {
        return view(MintbaseStore.FACTORY_ADDRESS, "check_contains_store", { store_id: storeId });
    }

    /**
     * get Mintabse's factory fee
     *
     * @returns
     */
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
            burned: JSON.parse(logs[2].split("burned: ")[1]),
            approved: JSON.parse(logs[3].split("approved: ")[1]),
            allow_moves: JSON.parse(logs[4].split("allow_moves: ")[1]),
        };
    }

    async listMinters(): Promise<string[]> {
        return view(this.address, "list_minters", {});
    }

    static async queryApi(query: string): Promise<any> {
        const variables = {};
        const result = await fetch(this.API_URL, {
            method: "post",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ query, variables }),
        });
        return await result.json();
    }

    static async getSimpleListing(
        nftContractId: string,
        tokenId: string
    ): Promise<{
        nft_token_id: string;
        nft_approval_id: number;
        nft_owner_id: string;
        nft_contract_id: string;
        price: string;
        currency: string;
        created_at: string;
        current_offer: unknown;
    }> {
        return view(this.SIMPLE_MARKETPLACE_ADDRESS, "get_listing", {
            nft_contract_id: nftContractId,
            token_id: tokenId,
        });
    }

    static async apiGetSimpleListings(
        nftContractAddress: string,
        metadataId: string
    ): Promise<
        {
            price: string;
            title: string;
            token_id: string;
            market_id: string;
            media: string;
        }[]
    > {
        const query = `{
            mb_views_active_listings(
                where:{
                    nft_contract_id: {_eq: "${nftContractAddress}"},
                    metadata_id: {_eq: "${nftContractAddress}:${metadataId}"},
                    kind: {_eq: "simple"},
                    currency: {_eq: "near"},
                    market_id: {_eq: "${this.SIMPLE_MARKETPLACE_ADDRESS}"}
                }
            ) {
                price
                title
                token_id
                market_id
                media
            }
          }
        `;
        const response = await this.queryApi(query);
        return response.data.mb_views_active_listings;
    }

    static async apiGetMetadataId(nftContractId: string, tokenId: string): Promise<string> {
        const query = `{
            mb_views_active_listings(
                where: {
                    nft_contract_id: {_eq: "${nftContractId}"},
                    token_id: {_eq: "${tokenId}"}
                }
            ) {
                metadata_id
            }
          }
        `;
        const response = await this.queryApi(query);
        const numListings = response.data.mb_views_active_listings.length;
        return numListings === 1 ? response.data.mb_views_active_listings[0].metadata_id.split(":")[1] : "";
    }

    static getInfoFromlistingUrl(url: string): { nftContractId: string; metadataId: string } | undefined {
        // create URL object from url
        let urlObj: URL;
        try {
            urlObj = new URL(url);
        } catch (e) {
            // input string isn't a valid URL
            return;
        }

        if (this.UI_BASE_URL === urlObj.origin) {
            const path: string[] = urlObj.pathname.split("/");
            const info = decodeURIComponent(path[2]).split(":");
            if (info.length !== 2) return;
            // check output validity: nftContractId is valid NEAR address
            if (args.string().address().isValidSync(info[0])) {
                return { nftContractId: info[0], metadataId: info[1] };
            }
            // outputs invalid
            else {
                return;
            }
        }
        // URL doesn't belong to the supported UI
        else {
            return;
        }
    }

    static isListingURLValid(urlString: string): boolean {
        return Boolean(this.getInfoFromlistingUrl(urlString));
    }
    // TODO: query store owner
}

export { MintbaseStore, BASE_URI_ARWEAVE };
export type { StoreInfo };
