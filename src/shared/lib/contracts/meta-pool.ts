import { view } from "../wallet";
import { HumanReadableAccount } from "./staking-pool";

export type GetAccountInfoResult = {
    account_id: string;

    /// The available balance that can be withdrawn
    available: string;

    /// The amount of stNEAR owned (shares owned)
    st_near: string;
    ///stNEAR owned valued in NEAR
    valued_st_near: string; // st_near * stNEAR_price

    //META owned (including pending rewards)
    meta: string;
    //realized META (without pending rewards)
    realized_meta: string;

    /// The amount unstaked waiting for withdraw
    unstaked: string;

    /// The epoch height when the unstaked will be available
    unstaked_requested_unlock_epoch: string;
    /// How many epochs we still have to wait until unstaked_requested_unlock_epoch (epoch_unlock - env::epoch_height )
    unstake_full_epochs_wait_left: number;
    ///if env::epoch_height()>=unstaked_requested_unlock_epoch
    can_withdraw: boolean;
    /// total amount the user holds in this contract: account.available + account.staked + current_rewards + account.unstaked
    total: string;

    //-- STATISTICAL DATA --
    // User's statistical data
    // These fields works as a car's "trip meter". The user can reset them to zero.
    /// trip_start: (unix timestamp) this field is set at account creation, so it will start metering rewards
    trip_start: string;
    /// How many stnear the user had at "trip_start".
    trip_start_stnear: string; // OBSOLETE
    /// how much the user staked since trip start. always incremented
    trip_accum_stakes: string;
    /// how much the user unstaked since trip start. always incremented
    trip_accum_unstakes: string;
    /// to compute trip_rewards we start from current_stnear, undo unstakes, undo stakes and finally subtract trip_start_stnear
    /// trip_rewards = current_stnear + trip_accum_unstakes - trip_accum_stakes - trip_start_stnear;
    /// trip_rewards = current_stnear + trip_accum_unstakes - trip_accum_stakes - trip_start_stnear;
    trip_rewards: string;

    //Liquidity Pool
    nslp_shares: string;
    nslp_share_value: string;
    nslp_share_bp: number; //basis points, % user owned
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

    async getAccountInfo(accountId: string): Promise<GetAccountInfoResult> {
        return view(this.address, "get_account_info", { account_id: accountId });
    }
}
