import { view } from "../wallet";
import { args } from "../args/args";

const MARKETPLACE_ADDRESS_SELECTOR: Record<string, string> = {
    mainnet: "marketplace.paras.near",
    testnet: "paras-marketplace-v2.testnet",
};

const NFT_CONTRACT_ADDRESS_SELECTOR: Record<string, string> = {
    mainnet: "x.paras.near",
    testnet: "paras-token-v2.testnet",
};

// base URLs for Paras UI
const UI_URL_SELECTOR: Record<string, string> = {
    mainnet: "https://paras.id",
    testnet: "https://testnet.paras.id",
};

type MarketDataJson = {
    owner_id: string;
    approval_id: string;
    nft_contract_id: string;
    token_id: string;
    ft_token_id: string; // "near" for NEAR token
    price: string;
    bids?: any;
    started_at?: string;
    ended_at?: string;
    end_price?: string;
    is_auction?: boolean;
    transaction_fee?: string;
};

class Paras {
    static MARKETPLACE_ADDRESS: string = MARKETPLACE_ADDRESS_SELECTOR[window.NEAR_ENV];
    static NFT_CONTRACT_ADDRESS: string = NFT_CONTRACT_ADDRESS_SELECTOR[window.NEAR_ENV];
    static UI_BASE_URL: string = UI_URL_SELECTOR[window.NEAR_ENV];

    static async getMarketData(nftContractId: string, tokenId: string): Promise<MarketDataJson | null> {
        return view(this.MARKETPLACE_ADDRESS, "get_market_data", {
            nft_contract_id: nftContractId,
            token_id: tokenId,
        }).catch(() => null);
    }

    static getInfoFromListingUrl(url: string): { nftContractId: string; tokenId: string } | undefined {
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
            const info = path[2].split("::");
            // check output validity: nftContractId is valid NEAR address
            if (info.length === 2 && args.string().address().isValidSync(info[0])) {
                const tokenIdEncoded = path.length === 4 ? path.pop()! : info.pop()!;
                return { nftContractId: info[0], tokenId: decodeURIComponent(tokenIdEncoded) };
            }
        }
    }

    static isListingURLValid(urlString: string): boolean {
        return Boolean(this.getInfoFromListingUrl(urlString));
    }
}

export { Paras };
export type { MarketDataJson };
