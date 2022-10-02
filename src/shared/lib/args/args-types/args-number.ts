import { NumberSchema } from "yup";
import { addErrorMethods, ErrorMethods } from "../args-error";

declare module "yup" {
    interface NumberSchema extends ErrorMethods {}
}

addErrorMethods(NumberSchema);

export { NumberSchema };
