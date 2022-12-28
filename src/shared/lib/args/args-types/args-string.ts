import { addMethod, StringSchema as _StringSchema } from "yup";
import { Validation } from "../../validation";
import { hasContract } from "../../contracts/generic";
import { MintbaseStore } from "../../contracts/mintbase";
import { Multicall } from "../../contracts/multicall";
import { SputnikDAO } from "../../contracts/sputnik-dao";
import { StakingPool } from "../../contracts/staking-pool";
import { FungibleToken } from "../../standards/fungibleToken";
import { MultiFungibleToken } from "../../standards/multiFungibleToken";
import { NonFungibleToken } from "../../standards/nonFungibleToken";
import { locale } from "../args-error";

declare module "yup" {
    interface StringSchema {
        json(message?: string): this;
        dataUrl(message?: string): this;
        address(message?: string): this;
        contract(message?: string): this;
        sputnikDao(message?: string): this;
        multicall(message?: string): this;
        ft(message?: string): this;
        nft(message?: string): this;
        nftId(addressKey: string, message?: string): this;
        mftId(addressKey: string, message?: string): this;
        stakingPool(message?: string): this;
        mintbaseStore(message?: string): this;
        intoUrl(): this;
        intoBaseAddress(prefixes?: string[]): this;
        append(appendStr: string): this;
    }
}

// Regexp for NEAR account IDs. See: https://github.com/near/nearcore/blob/180e5dda991ad7bdbb389a931e84d24e31fb0674/core/account-id/src/lib.rs#L240
const rAddress: RegExp = /^(?=.{2,64}$)(([a-z\d]+[-_])*[a-z\d]+\.)*([a-z\d]+[-_])*[a-z\d]+$/;

// TODO maybe yup.object().json() already does this?
// ensure string is json interpretable
addMethod(_StringSchema, "json", function json(message = locale.string.json) {
    return this.test({
        name: "json",
        message,
        test: (value) => {
            if (value == null) return true;
            try {
                if (JSON.parse(value)) return true;
            } catch (e) {}
            return false;
        },
    });
});

// ensure string is a valid NEAR address
addMethod(_StringSchema, "address", function address(message = locale.string.address) {
    return this.matches(rAddress, {
        name: "address",
        message,
        excludeEmptyString: false,
    });
});

// ensure string is a valid NEAR address with a contract
addMethod(_StringSchema, "contract", function contract(message = locale.string.contract) {
    return this.address().test({
        name: "contract",
        message,
        test: async (value) => {
            if (value == null) return true;
            try {
                return !!(await hasContract(value));
            } catch (e) {
                // TODO check reason for error
                // console.warn("error occured while checking for contract instance at", value);
                return false;
            }
        },
    });
});

// ensure string is a valid NEAR address with a contract
addMethod(_StringSchema, "dataUrl", function contract(message = locale.string.dataUrl) {
    return this.test({
        name: "data url",
        message,
        test: (value) => value != null && Validation.isDataURL(value),
    });
});

// ensure string is a valid NEAR address with a SputnikDAO contract
addMethod(_StringSchema, "sputnikDao", function sputnikDao(message = locale.string.sputnikDao) {
    return this.address().test({
        name: "sputnikDao",
        message,
        test: async (value) => {
            if (value == null) return true;
            try {
                return !!(await SputnikDAO.isSputnikDAO(value));
            } catch (e) {
                // TODO check reason for error
                // console.warn("error occured while checking for dao instance at", value);
                return false;
            }
        },
    });
});

// ensure string is a valid NEAR address with a multicall contract
addMethod(_StringSchema, "multicall", function multicall(message = locale.string.multicall) {
    return this.address().test({
        name: "multicall",
        message,
        test: async (value) => {
            if (value == null) return true;
            try {
                // TODO store and expose query results in retained data for later use
                return !!(await Multicall.isMulticall(value));
            } catch (e) {
                // TODO check reason for error
                // console.warn("error occured while checking for multicall instance at", value);
                return false;
            }
        },
    });
});

// ensure string is a valid NEAR address with a token contract
addMethod(_StringSchema, "ft", function ft(message = locale.string.ft) {
    return this.address().test({
        name: "ft",
        message,
        test: async (value) => {
            if (value == null) return true;
            try {
                const fungibleToken = await FungibleToken.init(value);
                return fungibleToken.ready;
            } catch (e) {
                // TODO check reason for error
                // console.warn("error occured while checking for fungible token at", value);
                return false;
            }
        },
    });
});

// ensure string is a valid NEAR address with a non fungible token contract
addMethod(_StringSchema, "nft", function nft(message = locale.string.nft) {
    return this.address().test({
        name: "nft",
        message,
        test: async (value) => {
            if (value == null) return true;
            return await NonFungibleToken.isNft(value);
        },
    });
});

// ensure string is a valid NEAR address with a multi token contract and belonging id
addMethod(_StringSchema, "nftId", function nftId(addressKey: string, message = locale.string.nftId) {
    return this.test({
        name: "nftId",
        message,
        test: async (value, context) => {
            if (value == null) return true;
            try {
                const nonFungibleToken = await NonFungibleToken.init(context.parent[addressKey], value);
                return nonFungibleToken.ready;
            } catch (e) {
                // TODO check reason for error
                // console.warn("error occured while checking for multicall instance at", value);
                return false;
            }
        },
    });
});

// ensure string is a valid NEAR address with a multi token contract and belonging id
addMethod(_StringSchema, "mftId", function mftId(addressKey: string, message = locale.string.mftId) {
    return this.test({
        name: "mftId",
        message,
        test: async (value, context) => {
            if (value == null) return true;
            try {
                const multiFungibleToken = await MultiFungibleToken.init(context.parent[addressKey], value);
                return multiFungibleToken.ready;
            } catch (e) {
                // TODO check reason for error
                // console.warn("error occured while checking for MFT at", value);
                return false;
            }
        },
    });
});

// ensure string is a valid NEAR address with a staking pool contract
addMethod(_StringSchema, "stakingPool", function stakingPool(message = locale.string.stakingPool) {
    return this.address().test({
        name: "stakingPool",
        message,
        test: async (value) => {
            if (value == null) return true;
            try {
                const stakingPool = await StakingPool.init(value);
                return stakingPool.ready;
            } catch (e) {
                // TODO check reason for error
                // console.warn("error occured while checking for staking pool at", value);
                return false;
            }
        },
    });
});

// ensure string is a valid NEAR address with a mintbase store contract
addMethod(_StringSchema, "mintbaseStore", function mintbaseStore(message = locale.string.mintbaseStore) {
    return this.address().test({
        name: "mintbaseStore",
        message,
        test: async (value) => {
            if (value == null) return true;
            const addrParts = value.split(".");
            const storeName = addrParts[0];
            const storeFactory = addrParts.slice(1).join(".");
            if (storeFactory !== MintbaseStore.FACTORY_ADDRESS) return false;
            try {
                const isMintbaseStore = await MintbaseStore.isMintbaseStore(storeName);
                return isMintbaseStore;
            } catch (e) {
                // TODO check reason for error
                // console.warn("error occured while checking for mintbase store at", value);
                return false;
            }
        },
    });
});

// transfrom address into URL
addMethod(_StringSchema, "intoUrl", function intoUrl() {
    return this.address().transform((value) => `https://explorer.${window.NEAR_ENV}.near.org/accounts/${value}`);
});

// transform address into base address
addMethod(
    _StringSchema,
    "intoBaseAddress",
    function intoBaseAddress(postfixes: string[] = [SputnikDAO.FACTORY_ADDRESS, Multicall.FACTORY_ADDRESS]) {
        return this.address().transform((value) => {
            let res = value;
            for (let pf of postfixes) {
                if (value.endsWith("." + pf)) {
                    const base = value.split("." + pf)[0];
                    if (base.length < res.length) res = base;
                }
            }
            return res;
        });
    }
);

// !!! although not starting with "into", this is a mutating function !!!
// append string
addMethod(_StringSchema, "append", function append(appendStr: string) {
    return this.transform((value) => `${value}${appendStr}`);
});

export { _StringSchema as StringSchema };
