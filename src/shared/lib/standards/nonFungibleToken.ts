import { view } from "../wallet";
import { StorageManagement } from "./storageManagement";
import type { StorageBalance, StorageBalanceBounds } from "./storageManagement";

// Non-Fungible token metadata follows NEP-177. See: https://nomicon.io/Standards/Tokens/NonFungibleToken/Metadata
type NFTContractMetadata = {
    spec: string; // required, essentially a version like "nft-2.0.0", replacing "2.0.0" with the implemented version of NEP-177
    name: string; // required, ex. "Mochi Rising — Digital Edition" or "Metaverse 3"
    symbol: string; // required, ex. "MOCHI"
    icon: string | null; // Data URL
    base_uri: string | null; // Centralized gateway known to have reliable access to decentralized storage assets referenced by `reference` or `media` URLs
    reference: string | null; // URL to a JSON file with more info
    reference_hash: string | null; // Base64-encoded sha256 hash of JSON from reference field. Required if `reference` is included.
};

type TokenMetadata = {
    title: string | null; // ex. "Arch Nemesis: Mail Carrier" or "Parcel #5055"
    description: string | null; // free-form description
    media: string | null; // URL to associated media, preferably to decentralized, content-addressed storage
    media_hash: string | null; // Base64-encoded sha256 hash of content referenced by the `media` field. Required if `media` is included.
    copies: number | null; // number of copies of this set of metadata in existence when token was minted.
    issued_at: number | null; // When token was issued or minted, Unix epoch in milliseconds
    expires_at: number | null; // When token expires, Unix epoch in milliseconds
    starts_at: number | null; // When token starts being valid, Unix epoch in milliseconds
    updated_at: number | null; // When token was last updated, Unix epoch in milliseconds
    extra: string | null; // anything extra the NFT wants to store on-chain. Can be stringified JSON.
    reference: string | null; // URL to an off-chain JSON file with more info.
    reference_hash: string | null; // Base64-encoded sha256 hash of JSON from reference field. Required if `reference` is included.
};

// Non-Fungible token core follows NEP-171, See https://nomicon.io/Standards/Tokens/NonFungibleToken/Core
type Token = {
    token_id: string;
    owner_id: string;
    metadata: TokenMetadata;
    approved_account_ids: Record<string, number>;
};

// Fungible token core follow NEP-171. See: https://nomicon.io/Standards/Tokens/NonFungibleToken/Core
// Also implements NEP-145 for storage management. See: https://nomicon.io/Standards/StorageManagement
class NonFungibleToken extends StorageManagement {
    address: string;
    // Initial invalid state of token
    token: Token | null = null;
    // Token instance is ready when info (metadata...) are fetched & assigned correctly
    ready: boolean = false;

    // shouldn't be used directly, use init() instead
    constructor(tokenAddress: string) {
        super(tokenAddress);
        this.address = tokenAddress;
    }

    // used to create and initialize a NonFungibleToken instance
    static async init(tokenAddress: string, tokenId: string): Promise<NonFungibleToken> {
        // fetch token info and mark it ready
        const newToken = new NonFungibleToken(tokenAddress);
        const [token] = await Promise.all([
            // on failure set metadata to default metadata (empty)
            newToken.nftToken(tokenId).catch((_err) => {
                return newToken.token;
            }),
        ]);
        newToken.token = token;
        // set ready to true if token info successfully got updated.
        if (newToken.token !== null) {
            newToken.ready = true;
        }
        return newToken;
    }

    // tell if a contract is a NFT contract by querying the metadata
    static async isNft(tokenAddress: string): Promise<boolean> {
        const nft = new NonFungibleToken(tokenAddress);
        try {
            await nft.nftMetadata();
            return true;
        } catch (e) {
            return false;
        }
    }

    // NEP-171 function
    // Returns the token with the given `token_id` or `null` if no such token.
    async nftToken(tokenId: string): Promise<Token | null> {
        return view(this.address, "nft_token", { token_id: tokenId });
    }

    // NEP-177 function
    async nftMetadata(): Promise<NFTContractMetadata> {
        return view(this.address, "nft_metadata", {});
    }

    // NEP-178 function
    // Check if a token is approved for transfer by a given account, optionally checking an approval_id
    async nftIsApproved(tokenId: string, approvedAccountId: string, approvalId: number | null): Promise<boolean> {
        return view(this.address, "nft_is_approved", {
            token_id: tokenId,
            approved_account_id: approvedAccountId,
            approval_id: approvalId,
        });
    }

    // NEP-181 function
    // Returns the total supply of non-fungible tokens as a string representing an unsigned 128-bit integer to avoid JSON number limit of 2^53; and "0" if there are no tokens.
    async nftTotalSupply(): Promise<string> {
        return view(this.address, "nft_total_supply", {});
    }

    // NEP-181 function
    // Get a list of all tokens
    async nftTokens(
        fromIndex: string | null = "0", // default: "0"
        limit: number | null = null // default: unlimited (could fail due to gas limit)
    ): Promise<Token[]> {
        return view(this.address, "nft_tokens", {
            from_index: fromIndex,
            limit,
        });
    }

    // NEP-181 function
    // Get number of tokens owned by a given account
    async nftSupplyForOwner(accountId: string): Promise<string> {
        return view(this.address, "nft_supply_for_owner", { account_id: accountId });
    }

    // NEP-181 function
    // Get list of all tokens owned by a given account
    async nftTokensForOwner(
        accountId: string,
        fromIndex: string | null = "0", // default: "0"
        limit: number | null = null // default: unlimited (could fail due to gas limit)
    ): Promise<Token[]> {
        return view(this.address, "nft_tokens_for_owner", {
            account_id: accountId,
            from_index: fromIndex,
            limit,
        });
    }
}

export { NonFungibleToken };
