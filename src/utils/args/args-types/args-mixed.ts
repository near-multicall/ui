import { MixedSchema } from "yup";
import { addErrorMethods } from "../args-error";
import { addFieldMethods } from "../args-form";

addErrorMethods(MixedSchema);
addFieldMethods(MixedSchema);

export { MixedSchema };
