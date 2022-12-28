import { ArraySchema as _ArraySchema } from "yup";

declare module "yup" {
    interface ArraySchema<T, C, TIn, TOut> {}
}

export { _ArraySchema as ArraySchema };
