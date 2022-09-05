import { viewAccount } from "../wallet";

const FACTORY_ADDRESS_SELECTOR: Record<string, string> = {
    mainnet: "v1.multicall.near",
    testnet: "v1_03.multicall.testnet",
};

// Multicall contract mapping: version <-> code hashes
const CONTRACT_CODE_HASHES_SELECTOR: Record<string, string[]> = {
    mainnet: [
        "6Em7E4Zs7d9oQkZSkMZ2CQuT2Wem3gPSpqDJ4VwFM79f", // v1
    ],
    testnet: [
        "6Em7E4Zs7d9oQkZSkMZ2CQuT2Wem3gPSpqDJ4VwFM79f", // v1_03
    ],
};

export default class Multicall {
    static FACTORY_ADDRESS: string = FACTORY_ADDRESS_SELECTOR[window.NEAR_ENV];
    static CONTRACT_CODE_HASHES: string[] = CONTRACT_CODE_HASHES_SELECTOR[window.NEAR_ENV];

    MULTICALL_ADDRESS: string;

    constructor(multicall_address: string) {
        this.MULTICALL_ADDRESS = multicall_address;
    }

    /**
     * check of given accountId is a multicall instance.
     * uses code_hash of the contract deployed on accountId.
     *
     * @param accountId
     */
     static async isMulticall(accountId: string): Promise<boolean> {
        const accountInfo = await viewAccount(accountId);
        const codeHash: string = accountInfo.code_hash;
        return Multicall.CONTRACT_CODE_HASHES.includes(codeHash);
    }
}
