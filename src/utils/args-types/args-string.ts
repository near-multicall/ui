import { addMethod, StringSchema as _StringSchema } from "yup";
import { hasContract } from "../contracts/generic";
import Multicall from "../contracts/multicall";
import { SputnikDAO } from "../contracts/sputnik-dao";
import { locale } from "./args-error";

declare module "yup" {
    interface StringSchema {
        json(message?: string): this;
        address(message?: string): this;
        contract(message?: string): this;
        sputnikDao(message?: string): this;
        multicall(message?: string): this;
        intoUrl(): this;
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
            if (value == null || value == "") return true;
            try {
                if (JSON.parse(value)) return false;
            } catch (e) {}
            return true;
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
        test: async (value) => value == null || !!(await hasContract(value)),
    });
});

// ensure string is a valid NEAR address with a SputnikDAO contract
addMethod(_StringSchema, "sputnikDao", function sputnikDao(message = locale.string.sputnikDao) {
    return this.contract().test({
        name: "sputnikDao",
        message,
        test: async (value) => value == null || !!(await SputnikDAO.isSputnikDAO(value)),
    });
});

// ensure string is a valid NEAR address with a multicall contract
addMethod(_StringSchema, "multicall", function multicall(message = locale.string.multicall) {
    return this.contract().test({
        name: "multicall",
        message,
        test: async (value) => value == null || !!(await Multicall.isMulticall(value)),
    });
});

// transfrom address into URL
addMethod(_StringSchema, "intoUrl", function intoUrl() {
    return this.address().transform((value) => `https://explorer.${window.NEAR_ENV}.near.org/accounts/${value}`);
});

export { _StringSchema as StringSchema };