import { view } from "../wallet";
import type { StorageBalanceBounds } from "./storageManagement";

// Fungible token metadata follows NEP-148. See: https://nomicon.io/Standards/Tokens/FungibleToken/Metadata
type MultiFungibleTokenMetadata = {
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
class MultiFungibleToken {
    address: string;
    id: string;
    // needs initialization, but start with empty metadata
    metadata: MultiFungibleTokenMetadata = { spec: "", name: "", symbol: "", decimals: -1 };
    // storage balance bounds. Needs initialization, but starts with "0" values
    // Users must have at least the min amount to receive tokens.
    storageBounds: StorageBalanceBounds = { min: "0", max: "0" };
    // Token instance is ready when info (metadata...) are fetched & assigned correctly
    ready: boolean = false;

    // shouldn't be used directly, use init() instead
    constructor(tokenAddress: string, tokenId: string) {
        this.address = tokenAddress;
        this.id = tokenId;
    }

    // used to create and initialize a FungibleToken instance
    static async init(tokenAddress: string, tokenId: string): Promise<MultiFungibleToken> {
        // fetch token info and mark it ready
        const newToken = new MultiFungibleToken(tokenAddress, tokenId);
        const [metadata] = await Promise.all([
            // on failure set metadata to default metadata (empty)
            newToken.ftMetadata().catch((err) => {
                return newToken.metadata;
            }),
        ]);
        newToken.metadata = metadata;
        // set ready to true if token info successfully got updated.
        if (newToken.metadata.decimals >= 0) {
            newToken.ready = true;
        }
        return newToken;
    }

    async ftMetadata(): Promise<MultiFungibleTokenMetadata> {
        return view(this.address, "mft_metadata", { token_id: this.id });
    }
}

export { MultiFungibleToken };
