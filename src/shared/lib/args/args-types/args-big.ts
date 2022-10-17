import { BigSource } from "big.js";
import { MixedSchema } from "yup";
import { Big, formatTokenAmount, parseTokenAmount, toGas, unit, unitToDecimals } from "../../converter";
import { addErrorMethods, ErrorMethods, locale } from "../args-error";

declare module "yup" {
    interface BigSchema extends ErrorMethods {}
}
class BigSchema extends MixedSchema<Big> {
    constructor() {
        super({ type: "big" });
        this.withMutation(() =>
            this.transform(function (value) {
                try {
                    return Big(value.toString());
                } catch (e) {
                    return value;
                }
            })
        );
    }

    // override default yup method (disallow for empty string)
    _isPresent(value: any): boolean {
        return super._isPresent(value) && value !== "";
    }

    /**
     * ensure value is greater equal than a minimum
     * @param min
     * @param message
     * @returns
     */
    min(min: BigSource, message: string = locale.big.min) {
        return this.test({
            name: "min",
            params: { min },
            message,
            test: (value) => value == null || value.gte(min),
        });
    }

    /**
     * ensure value is less equal than a maximum
     * @param max
     * @param message
     * @returns
     */
    max(max: BigSource, message: string = locale.big.max) {
        return this.test({
            name: "max",
            params: { max },
            message,
            test: (value) => value == null || value.lte(max),
        });
    }

    // TODO auto try to truncate value
    /**
     * ensure value does not have too many decimal places
     * @param decimalsOrUnit
     * @param message
     * @returns
     */
    maxDecimalPlaces(decimalsOrUnit: number | unit, message: string = locale.big.maxDecimalPlaces) {
        const decimals = typeof decimalsOrUnit === "number" ? decimalsOrUnit : unitToDecimals[decimalsOrUnit];
        return this.test({
            name: "maxDecimalPlaces",
            params: { decimals },
            message,
            test: (value) => value == null || !(value.toString().split(".")[1]?.length > decimals),
        });
    }

    /**
     * short hand rule for gas values: 0 <= gas <= 300, gas input expected in Tgas per default
     * @returns
     */
    gas() {
        return this.token().max(toGas("300"));
    }

    /**
     * short hand rule for token amount: 0 <= token and limited decimal places
     * @returns
     */
    token() {
        return this.maxDecimalPlaces(0).min(0);
    }

    /**
     * short hand rule for exact one yocto amount
     * @returns
     */
    oneYocto() {
        return this.token().max(1);
    }

    /**
     * transform value to human readable value
     * @param decimalsOrUnit
     * @param message
     * @returns
     */
    intoFormatted(decimalsOrUnit: number | unit, message: string = locale.big.format) {
        const decimals = typeof decimalsOrUnit === "number" ? decimalsOrUnit : unitToDecimals[decimalsOrUnit];
        let formatFailed = false;
        return this.transform((value) => {
            if (value == null) return null;
            try {
                return new Big(formatTokenAmount(value, decimals));
            } catch (e) {
                formatFailed = true;
                return null;
            }
        }).test({
            name: "format",
            message,
            test: (value) => !(formatFailed && value == null),
        });
    }

    /**
     * transform value to indivisbile units
     * @param decimalsOrUnit
     * @param message
     * @returns
     */
    intoParsed(decimalsOrUnit: number | unit, message: string = locale.big.parse) {
        const decimals = typeof decimalsOrUnit === "number" ? decimalsOrUnit : unitToDecimals[decimalsOrUnit];
        let parseFailed = false;
        return this.transform((value) => {
            if (value == null) return null;
            try {
                return new Big(parseTokenAmount(value, decimals));
            } catch (e) {
                parseFailed = true;
                return null;
            }
        }).test({
            name: "parse",
            message,
            test: (value) => !(parseFailed && value == null),
        });
    }
}

addErrorMethods(BigSchema);

export { BigSchema };
