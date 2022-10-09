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
        this.spec.meta = {
            decimals: 0,
        };
    }

    // override default yup method (disallow for empty string)
    _isPresent(value: any): boolean {
        return super._isPresent(value) && value !== "";
    }

    // ensure value is greater equal than a minimum
    min(min: BigSource, message: string = locale.big.min) {
        return this.test({
            name: "min",
            params: { min },
            message,
            test: (value) => value == null || value.gte(min),
        });
    }

    // ensure value is less equal than a maximum
    max(max: BigSource, message: string = locale.big.max) {
        return this.test({
            name: "max",
            params: { max },
            message,
            test: (value) => value == null || value.lte(max),
        });
    }

    // TODO auto try to truncate value
    // ensure value does not have too many decimal places
    maxDecimalPlaces(
        decimalsOrUnit: number | unit = this.spec.meta.decimals,
        message: string = locale.big.maxDecimalPlaces
    ) {
        const decimals = typeof decimalsOrUnit === "number" ? decimalsOrUnit : unitToDecimals[decimalsOrUnit];
        return this.test({
            name: "maxDecimalPlaces",
            params: { decimals },
            message,
            test: (value) => value == null || !(value.toString().split(".")[1]?.length > decimals),
        }).meta({
            decimals,
        });
    }

    // short hand rule for gas values: 0 <= gas <= 300, gas input expected in Tgas per default
    gas(initialUnit: "gas" | "Tgas" = "Tgas") {
        return this.token(initialUnit).max(toGas("300"));
    }

    // short hand rule for token amount: 0 <= token and limited decimal places
    token(initialDecimalsOrUnit: number | unit) {
        return this.maxDecimalPlaces(initialDecimalsOrUnit).intoParsed().min(0);
    }

    // transform value to human readable value
    // decimals can be determined from direct input, unit input or from memory (via this.decimals)
    intoFormatted(decimalsOrUnit: number | unit = this.spec.meta.decimals, message: string = locale.big.format) {
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
        })
            .test({
                name: "format",
                message,
                test: (value) => !(formatFailed && value == null),
            })
            .meta({ decimals });
    }

    // transform value to indivisbile units
    // decimals can be determined from direct input, unit input or from memory (via this.decimals)
    intoParsed(decimalsOrUnit: number | unit = this.spec.meta.decimals, message: string = locale.big.parse) {
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
        })
            .test({
                name: "parse",
                message,
                test: (value) => !(parseFailed && value == null),
            })
            .meta({ decimals });
    }

    // // !!! although not starting with "into", this is a mutating function !!!
    // // transform value into another if original value is empty
    // ifEmpty(replace: BigSource) {
    //     return this.transform((_, value) => (value === "" ? replace : value));
    // }
}

addErrorMethods(BigSchema);

export { BigSchema };
