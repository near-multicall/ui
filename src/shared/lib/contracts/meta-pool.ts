import { view } from "../wallet";

type HumanReadableAccount = {
    account_id: string;
    /// The unstaked balance that can be withdrawn or staked.
    unstaked_balance: string;
    /// The amount balance staked at the current "stake" share price.
    staked_balance: string;
    /// Whether the unstaked balance is available for withdrawal now.
    can_withdraw: boolean;
};

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

    async getAccount(accountId: string): Promise<HumanReadableAccount> {
        return view(this.address, "get_account", { account_id: accountId });
    }
}
