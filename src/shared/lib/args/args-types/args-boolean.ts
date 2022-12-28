import { BooleanSchema as _BooleanSchema } from "yup";

declare module "yup" {
    interface BooleanSchema {}
}

export { _BooleanSchema as BooleanSchema };
