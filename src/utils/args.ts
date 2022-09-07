import { AnySchema, ArraySchema, BooleanSchema, NumberSchema } from "yup";
import { BigSchema } from "./args-types/args-big";
import { ArgsError, ArgsErrorOptions } from "./args-types/args-error";
import { ObjectSchema } from "./args-types/args-object";
import { StringSchema } from "./args-types/args-string";

export const args = {
    array: () => new ArraySchema(),
    big: () => new BigSchema(),
    boolean: () => new BooleanSchema(),
    number: () => new NumberSchema(),
    object: () => new ObjectSchema(),
    string: () => new StringSchema(),
    error: (schema: AnySchema, options?: ArgsErrorOptions) => new ArgsError(schema, options),
};

console.log(args.big().token("NEAR"));
