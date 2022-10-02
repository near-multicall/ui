import { MixedSchema } from "yup";
import { addErrorMethods, ErrorMethods } from "../args-error";

declare module "yup" {
    interface MixedSchema extends ErrorMethods {}
}

addErrorMethods(MixedSchema);

export { MixedSchema };
