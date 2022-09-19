import { BooleanSchema } from "yup";
import { addErrorMethods } from "../args-error";
import { addFieldMethods } from "../args-form";

addErrorMethods(BooleanSchema);
addFieldMethods(BooleanSchema);

export { BooleanSchema };
