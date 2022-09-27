import { BigSource } from "big.js";
import { MixedSchema } from "yup";
import { Big, formatTokenAmount, parseTokenAmount, toGas, unit, unitToDecimals } from "../../converter";
import { addErrorMethods, ErrorMethods, locale } from "../args-error";
import { addFieldMethods, FieldMethods } from "../args-form";

declare module "yup" {
    interface BigSchema extends ErrorMethods, FieldMethods {}
}
class BigSchema extends MixedSchema<Big> {
    constructor() {
        super({ type: "big" });
        this.spec.meta = {
            decimals: 0,
        };
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
    intoFormatted(decimalsOrUnit: number | unit = this.spec.meta.decimals) {
        const decimals = typeof decimalsOrUnit === "number" ? decimalsOrUnit : unitToDecimals[decimalsOrUnit];
        return this.transform((value) => new Big(formatTokenAmount(value, decimals))).meta({ decimals });
    }

    // transform value to indivisbile units
    // decimals can be determined from direct input, unit input or from memory (via this.decimals)
    intoParsed(decimalsOrUnit: number | unit = this.spec.meta.decimals) {
        const decimals = typeof decimalsOrUnit === "number" ? decimalsOrUnit : unitToDecimals[decimalsOrUnit];
        return this.transform((value) => new Big(parseTokenAmount(value, decimals))).meta({ decimals });
    }
}

addErrorMethods(BigSchema);
addFieldMethods(BigSchema);

export { BigSchema };
