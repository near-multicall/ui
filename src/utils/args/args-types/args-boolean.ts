import { BooleanSchema } from "yup";
import { addErrorMethods, ErrorMethods } from "../args-error";
import { addFieldMethods, FieldMethods } from "../args-form";

declare module "yup" {
    interface BooleanSchema extends ErrorMethods, FieldMethods {}
}

addErrorMethods(BooleanSchema);
addFieldMethods(BooleanSchema);

export { BooleanSchema };
