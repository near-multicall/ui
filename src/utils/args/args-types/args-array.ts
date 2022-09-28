import { ArraySchema, BaseSchema } from "yup";
import { addErrorMethods, ErrorMethods } from "../args-error";
import { addFieldMethods, FieldMethods } from "../args-form";

declare module "yup" {
    interface ArraySchema<T, C, TIn, TOut> extends BaseSchema<TIn, C, TOut>, ErrorMethods, FieldMethods {}
}

addErrorMethods(ArraySchema);
addFieldMethods(ArraySchema);

export { ArraySchema };
