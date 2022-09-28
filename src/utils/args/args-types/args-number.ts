import { NumberSchema } from "yup";
import { addErrorMethods, ErrorMethods } from "../args-error";
import { addFieldMethods, FieldMethods } from "../args-form";

declare module "yup" {
    interface NumberSchema extends ErrorMethods, FieldMethods {}
}

addErrorMethods(NumberSchema);
addFieldMethods(NumberSchema);

export { NumberSchema };
