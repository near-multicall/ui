export const keywords = {
    "": {
        "": ["custom"],
    },
    near: {
        ft_transfer: ["pay", "fungible", "token"],
        ft_transfer_call: ["pay", "fungible", "token"],
        nft_transfer: ["token", "non fungible"],
        nft_transfer_call: ["token", "non fungible"],
        nft_approve: ["token", "non fungible"],
        nft_revoke: ["revoke_all", "token", "non fungible"],
        mft_transfer: ["LP", "token"],
        mft_transfer_call: ["LP", "token"],
        deposit_and_stake: ["validator"],
        unstake: ["validator", "unstake_all"],
        withdraw: ["validator"],
        storage_withdraw: [],
        storage_unregister: [],
        storage_deposit: [],
        near_deposit: ["wnear", "wrapped", "wrap", "fungible", "token"],
        near_withdraw: ["wnear", "wrapped", "unwrap", "fungible", "token"],
    },
    multicall: {
        near_transfer: ["pay"],
    },
    mintbase: {
        create_store: ["create store"],
        grant_minter: ["add minter"],
        revoke_minter: ["remove minter"],
        transfer_store_ownership: ["transfer store ownership"],
        buy: ["nft", "marketplace"],
    },
    paras: {
        buy: ["nft", "marketplace"],
    },
    token_farm: {
        create_token: ["TokenFarm", "treasury"],
    },
    "meta-pool": {
        nslp_add_liquidity: ["add liquidity", "lp"],
        nslp_remove_liquidity: ["remove liquidity", "lp"],
    },
};
