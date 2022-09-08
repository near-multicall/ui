import { AnySchema, ValidationError } from "yup";
import { ValidateOptions } from "yup/lib/types";

const locale = {
    big: {
        min: "value must be at least ${min}",
        max: "value must be at most ${max}",
        maxDecimalPlaces: "value must not have more than ${decimals} decimal places",
    },
    string: {
        json: "value must be a valid json string",
        address: "value must be a valid address",
        contract: "value must have a contract deployed",
        sputnikDao: "address must belong to a sputnik dao contract",
        multicall: "address must belong to a multicall contract",
    },
};

type ArgsErrorOptions = { initial?: boolean; dummy?: boolean; customMessage?: string };
class ArgsError {
    isBad: boolean = false;
    error: ValidationError | null = null;
    customMessage: string | null = null;
    message: string = "";
    checkAsync: (value: any, validateOptions: ValidateOptions) => Promise<boolean>;
    check: (value: any, validateOptions: ValidateOptions) => boolean;

    constructor(schema: AnySchema | null, options?: ArgsErrorOptions) {
        if (options && options.customMessage) this.customMessage = options.customMessage;
        if (options && options.initial) this.isBad = options.initial;
        if (options && options.dummy) {
            this.check = (_value: any, _validateOptions: ValidateOptions) => {
                this.error = new ValidationError("dummy");
                this.message = this.customMessage ?? this.error.message;
                return this.isBad;
            };
            this.checkAsync = (_value: any, _validateOptions: ValidateOptions) => {
                this.error = new ValidationError("dummy");
                this.message = this.customMessage ?? this.error.message;
                return Promise.resolve(this.isBad);
            };
        } else {
            this.check = (value: any, validateOptions: ValidateOptions) => {
                try {
                    schema!.validateSync(value, validateOptions);
                    this.error = null;
                    this.isBad = false;
                    this.message = "";
                } catch (e: any) {
                    if (e instanceof ValidationError) {
                        this.error = e;
                        this.isBad = true;
                        this.message = this.customMessage ?? this.error.message;
                    }
                }
                return this.isBad;
            };
            this.checkAsync = async (value: any, validateOptions: ValidateOptions) => {
                try {
                    await schema!.validate(value, validateOptions);
                    this.error = null;
                    this.isBad = false;
                    this.message = "";
                } catch (e: any) {
                    if (e instanceof ValidationError) {
                        this.error = e;
                        this.isBad = true;
                        this.message = this.customMessage ?? this.error.message;
                    }
                }
                return this.isBad;
            };
        }
    }
}

export { ArgsError, locale };
export type { ArgsErrorOptions };
