import { view, viewAccount } from "../wallet";

const FACTORIES_SELECTOR: Record<string, string[]> = {
    mainnet: ["pool.near", "poolv1.near"],
    testnet: ["pool.f863973.m0", "staking-farm-factory.testnet"],
};

// Staking pool contract mapping: version <-> code hashes
const CONTRACT_CODE_HASHES_SELECTOR: Record<string, string[]> = {
    mainnet: [
        "J1arLz48fgXcGyCPVckFwLnewNH6j1uw79thsvwqGYTY", // contracts created by "poolv1.near"
        "AjD4YJaXgpiRdiArqnzyDi7Bkr1gJms9Z2w7Ev5esTKB", // contracts created by "pool.near"
    ],
    testnet: [
        "J1arLz48fgXcGyCPVckFwLnewNH6j1uw79thsvwqGYTY", // contracts created by "poolv1.near"
        "5an2SdvPAwr8KAgBwEJsVotu11hPFRYT4mCkRUU5hdzw", // contracts created by "pool.near"
    ],
};

type feeFractionType = { numerator: number; denominator: number };

class StakingPool {
    static FACTORIES: string[] = FACTORIES_SELECTOR[window.NEAR_ENV];
    static CONTRACT_CODE_HASHES: string[] = CONTRACT_CODE_HASHES_SELECTOR[window.NEAR_ENV];

    address: string;
    // initialize with invalid values (denominator cannot be 0)
    feeFraction: feeFractionType = { numerator: 0, denominator: 0 };
    // Staking pool instance is ready when info (feeFraction ...) are fetched & assigned correctly
    ready: boolean = false;

    // shouldn't be used directly, use init() instead
    constructor(poolAddress: string) {
        this.address = poolAddress;
    }

    // used to create and initialize a staking pool instance
    static async init(poolAddress: string): Promise<StakingPool> {
        // verify address is a staking pool, fetch info and mark it ready
        const newStakingPool = new StakingPool(poolAddress);
        const [isStakingPool, rewardFeeFraction] = await Promise.all([
            // on failure set isStakingPool to false
            StakingPool.isStakingPool(poolAddress).catch((err) => {
                return false;
            }),
            // on failure set policy to default policy (empty)
            newStakingPool.getRewardFeeFraction(),
        ]);
        newStakingPool.feeFraction = rewardFeeFraction;
        // ready is true if address is a staing pool and fee fraction got updated.
        if (isStakingPool === true && newStakingPool.feeFraction.denominator !== 0) {
            newStakingPool.ready = true;
        }
        return newStakingPool;
    }

    /**
     * check of given accountId is a sputnikDAO instance.
     * uses code_hash of the contract deployed on accountId.
     *
     * @param accountId
     */
    static async isStakingPool(accountId: string): Promise<boolean> {
        const accountInfo = await viewAccount(accountId);
        const codeHash: string = accountInfo.code_hash;
        return StakingPool.CONTRACT_CODE_HASHES.includes(codeHash);
    }

    async getRewardFeeFraction(): Promise<feeFractionType> {
        return view(this.address, "get_reward_fee_fraction", {});
    }
}

export { StakingPool };
