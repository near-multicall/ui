import { BooleanSchema as _BooleanSchema } from "yup";
import { addErrorMethods, ErrorMethods } from "../args-error";

declare module "yup" {
    interface BooleanSchema extends ErrorMethods {}
}

addErrorMethods(_BooleanSchema);

export { _BooleanSchema as BooleanSchema };
