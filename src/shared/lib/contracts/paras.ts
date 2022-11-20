const MARKETPLACE_ADDRESS_SELECTOR: Record<string, string> = {
    mainnet: "marketplace.paras.near ",
    testnet: "paras-marketplace-v2.testnet",
};

const NFT_CONTRACT_ADDRESS_SELECTOR: Record<string, string> = {
    mainnet: "x.paras.near",
    testnet: "paras-token-v2.testnet",
};

export class Paras {
    address: string;

    constructor(address: string) {
        this.address = address;
    }
}
