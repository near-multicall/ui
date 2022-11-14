import { NumberSchema as _NumberSchema } from "yup";
import { addErrorMethods, ErrorMethods } from "../args-error";

declare module "yup" {
    interface NumberSchema extends ErrorMethods {}
}

addErrorMethods(_NumberSchema);

export { _NumberSchema as NumberSchema };
