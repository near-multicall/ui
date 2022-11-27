import { view } from "../wallet";

import type { StorageBalanceBounds } from "./storageManagement";
import { StorageManagement } from "./storageManagement";

// Fungible token metadata follows NEP-148. See: https://nomicon.io/Standards/Tokens/FungibleToken/Metadata
type FungibleTokenMetadata = {
    spec: string;
    name: string;
    symbol: string;
    icon?: string | null; // optional
    reference?: string | null; // optional
    reference_hash?: string | null; // optional
    decimals: number;
};

// Fungible token core follow NEP-141. See: https://nomicon.io/Standards/Tokens/FungibleToken/Core
// Also implements NEP-145 for storage management. See: https://nomicon.io/Standards/StorageManagement
class FungibleToken extends StorageManagement {
    address: string;
    // needs initialization, but start with empty metadata
    metadata: FungibleTokenMetadata = { spec: "", name: "", symbol: "", decimals: -1 };
    // storage balance bounds. Needs initialization, but starts with "0" values
    // Users must have at least the min amount to receive tokens.
    storageBounds: StorageBalanceBounds = { min: "0", max: "0" };
    // Token instance is ready when info (metadata...) are fetched & assigned correctly
    ready: boolean = false;

    // shouldn't be used directly, use init() instead
    constructor(tokenAddress: string) {
        super(tokenAddress);
        this.address = tokenAddress;
    }

    // used to create and initialize a FungibleToken instance
    static async init(tokenAddress: string): Promise<FungibleToken> {
        // fetch token info and mark it ready
        const newToken = new FungibleToken(tokenAddress);
        const [metadata, storageBounds] = await Promise.all([
            // on failure set metadata to default metadata (empty)
            newToken.ftMetadata().catch((err) => {
                return newToken.metadata;
            }),
            // get storage balance bounds
            newToken.storageBalanceBounds().catch((err) => {
                return { min: "0", max: "0" };
            }),
        ]);
        newToken.metadata = metadata;
        newToken.storageBounds = storageBounds;
        // set ready to true if token info successfully got updated.
        if (newToken.metadata.decimals >= 0) {
            newToken.ready = true;
        }
        return newToken;
    }

    async ftMetadata(): Promise<FungibleTokenMetadata> {
        return view(this.address, "ft_metadata", {});
    }

    async ftTotalSupply(): Promise<string> {
        return view(this.address, "ft_total_supply", {});
    }

    async ftBalanceOf(accountId: string): Promise<string> {
        return view(this.address, "ft_balance_of", { account_id: accountId });
    }

    static async getLikelyTokenContracts(accountId: string): Promise<string[]> {
        const response = await fetch(`${window.nearConfig.helperUrl}/account/${accountId}/likelyTokens`, {
            method: "GET",
            headers: { "Content-type": "application/json; charset=utf-8" },
        });

        // on success: return list of likely tokens owned by accountId
        if (response.ok) {
            return await response.json();
        }
        // on error: return empty list
        else {
            return [];
        }
    }
}

export { FungibleToken };
export type { FungibleTokenMetadata };
