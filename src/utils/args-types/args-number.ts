import { NumberSchema } from "yup";
import { addErrorMethods } from "./args-error";

addErrorMethods(NumberSchema);

export { NumberSchema };
