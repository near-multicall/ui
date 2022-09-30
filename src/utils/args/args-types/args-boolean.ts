import { BooleanSchema } from "yup";
import { addErrorMethods, ErrorMethods } from "../args-error";

declare module "yup" {
    interface BooleanSchema extends ErrorMethods {}
}

addErrorMethods(BooleanSchema);

export { BooleanSchema };
