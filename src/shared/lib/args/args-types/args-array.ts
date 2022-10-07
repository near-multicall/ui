import { ArraySchema as _ArraySchema, BaseSchema } from "yup";
import { addErrorMethods, ErrorMethods } from "../args-error";

declare module "yup" {
    interface ArraySchema<T, C, TIn, TOut> extends BaseSchema<TIn, C, TOut>, ErrorMethods {}
}

addErrorMethods(_ArraySchema);

export { _ArraySchema as ArraySchema };
