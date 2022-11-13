import type { FungibleTokenMetadata } from "../standards/fungibleToken";
import { view, viewAccount } from "../wallet";

const FACTORY_ADDRESS_SELECTOR: Record<string, string> = {
    mainnet: "tkn.near",
    testnet: "",
};

// const CONTRACT_CODE_HASHES_SELECTOR: Record<string, string[]> = {
//     mainnet: ["4AVV1KUVgi17XoXkqxUPzyMhERXu15mGawriPQvWmBKD"],
//     testnet: [],
// };

export type TokenArgs = {
    owner_id: string;
    total_supply: string;
    metadata: FungibleTokenMetadata;
};

export class TknFarm {
    static FACTORY_ADDRESS: string = FACTORY_ADDRESS_SELECTOR[window.NEAR_ENV];
    // static CONTRACT_CODE_HASHES: string[] = CONTRACT_CODE_HASHES_SELECTOR[window.NEAR_ENV];
    address: string;

    constructor(address: string) {
        this.address = address;
    }

    // /**
    //  * check of given accountId is a TknFarm instance.
    //  * uses code_hash of the contract deployed on accountId.
    //  *
    //  * @param accountId
    //  */
    // static async isTknFarm(accountId: string): Promise<boolean> {
    //     const accountInfo = await viewAccount(accountId);
    //     const codeHash: string = accountInfo.code_hash;
    //     return TknFarm.CONTRACT_CODE_HASHES.includes(codeHash);
    // }

    async getRequiredDeposit(args: TokenArgs, accountId: string): Promise<string> {
        return view(this.address, "get_required_deposit", { args, accountId });
    }

    async getToken(tokenId: string): Promise<TokenArgs> {
        return view(this.address, "get_token", { tokenId });
    }
}
