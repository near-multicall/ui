import { addMethod, StringSchema as _StringSchema } from "yup";
import { hasContract } from "../../contracts/generic";
import Multicall from "../../contracts/multicall";
import { SputnikDAO } from "../../contracts/sputnik-dao";
import { locale, addErrorMethods, ErrorMethods } from "../args-error";
import { addFieldMethods, FieldMethods } from "../args-form";

declare module "yup" {
    interface StringSchema extends ErrorMethods, FieldMethods {
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
    return this.test({
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
    return this.contract().test({
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
    return this.contract().test({
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

// transfrom address into URL
addMethod(_StringSchema, "intoUrl", function intoUrl() {
    return this.address().transform((value) => `https://explorer.${window.NEAR_ENV}.near.org/accounts/${value}`);
});

addErrorMethods(_StringSchema);
addFieldMethods(_StringSchema);

export { _StringSchema as StringSchema };
