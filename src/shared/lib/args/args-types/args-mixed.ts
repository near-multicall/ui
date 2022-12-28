import { MixedSchema as _MixedSchema } from "yup";

declare module "yup" {
    interface MixedSchema {}
}

class MixedSchema<T> extends _MixedSchema<T> {}

export { MixedSchema };
