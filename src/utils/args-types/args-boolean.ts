import { BooleanSchema } from "yup";
import { addErrorMethods } from "./args-error";

addErrorMethods(BooleanSchema);

export { BooleanSchema };
