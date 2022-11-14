import { MixedSchema as _MixedSchema } from "yup";
import { addErrorMethods, ErrorMethods } from "../args-error";

declare module "yup" {
    interface MixedSchema extends ErrorMethods {}
}

addErrorMethods(_MixedSchema);

export { _MixedSchema as MixedSchema };
