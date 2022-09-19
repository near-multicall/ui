import { NumberSchema } from "yup";
import { addErrorMethods } from "../args-error";
import { addFieldMethods } from "../args-form";

addErrorMethods(NumberSchema);
addFieldMethods(NumberSchema);

export { NumberSchema };
