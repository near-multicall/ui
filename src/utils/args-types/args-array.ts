import { ArraySchema } from "yup";
import { addErrorMethods } from "./args-error";

addErrorMethods(ArraySchema);

export { ArraySchema };
