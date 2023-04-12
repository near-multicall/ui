import { ArraySchema } from "./args-types/args-array";
import { BigSchema } from "./args-types/args-big";
import { BooleanSchema } from "./args-types/args-boolean";
import { MixedSchema } from "./args-types/args-mixed";
import { NumberSchema } from "./args-types/args-number";
import { ObjectSchema } from "./args-types/args-object";
import { StringSchema } from "./args-types/args-string";

export const args = {
    array: () => new ArraySchema(),
    big: () => new BigSchema(),
    boolean: () => new BooleanSchema(),
    mixed: <T>() => new MixedSchema<T>(),
    number: () => new NumberSchema(),
    object: () => new ObjectSchema(),
    string: () => new StringSchema(),
};
