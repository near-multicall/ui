import { addMethod, StringSchema as _StringSchema } from "yup";
import Reference from "yup/lib/Reference";
import { hasContract } from "../../contracts/generic";
import { Multicall } from "../../contracts/multicall";
import { SputnikDAO } from "../../contracts/sputnik-dao";
import { FungibleToken } from "../../standards/fungibleToken";
import { MultiFungibleToken } from "../../standards/multiFungibleToken";
import { locale, addErrorMethods, ErrorMethods } from "../args-error";

declare module "yup" {
    interface StringSchema extends ErrorMethods {
        json(message?: string): this;
        address(message?: string): this;
        contract(message?: string): this;
        sputnikDao(message?: string): this;
        multicall(message?: string): this;
        ft(message?: string): this;
        mft(addressKey: string, message?: string): this;
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
                // console.warn("error occured while checking for multicall instance at", value);
                return false;
            }
        },
    });
});

// ensure string is a valid NEAR address with a token contract
addMethod(_StringSchema, "mft", function mft(addressKey: string, message = locale.string.mft) {
    return this.test({
        name: "mft",
        message,
        test: async (value, context) => {
            if (value == null) return true;
            try {
                const multiFungibleToken = await MultiFungibleToken.init(context.parent[addressKey], value);
                return multiFungibleToken.ready;
            } catch (e) {
                // TODO check reason for error
                // console.warn("error occured while checking for multicall instance at", value);
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
    function intoBaseAddress(
        postfixes: string[] = [SputnikDAO.FACTORY_ADDRESS, window.nearConfig.MULTICALL_FACTORY_ADDRESS]
    ) {
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

addErrorMethods(_StringSchema);

export { _StringSchema as StringSchema };
