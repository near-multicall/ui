const FACTORY_ADDRESS_SELECTOR: Record<string, string> = {
    mainnet: "meta-pool.near",
    testnet: "meta-v2.pool.testnet",
};

export class MetaPool {
    static FACTORY_ADDRESS: string = FACTORY_ADDRESS_SELECTOR[window.NEAR_ENV];
    address: string;

    constructor(daoAddress: string) {
        this.address = daoAddress;
    }
}
