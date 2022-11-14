import { MixedSchema as _MixedSchema } from "yup";
import { addErrorMethods, ErrorMethods } from "../args-error";

declare module "yup" {
    interface MixedSchema extends ErrorMethods {}
}

class MixedSchema<T> extends _MixedSchema<T> {}

addErrorMethods(MixedSchema);

export { MixedSchema };
