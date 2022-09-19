import { MixedSchema } from "yup";
import { addErrorMethods } from "./args-error";

addErrorMethods(MixedSchema);

export { MixedSchema };
