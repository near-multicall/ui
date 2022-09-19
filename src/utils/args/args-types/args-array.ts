import { ArraySchema } from "yup";
import { addErrorMethods } from "../args-error";
import { addFieldMethods } from "../args-form";

addErrorMethods(ArraySchema);
addFieldMethods(ArraySchema);

export { ArraySchema };
