import { MixedSchema } from "yup";
import { addErrorMethods, ErrorMethods } from "../args-error";
import { addFieldMethods, FieldMethods } from "../args-form";

declare module "yup" {
    interface MixedSchema extends ErrorMethods, FieldMethods {}
}

addErrorMethods(MixedSchema);
addFieldMethods(MixedSchema);

export { MixedSchema };
