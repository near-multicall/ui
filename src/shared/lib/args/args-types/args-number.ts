import { NumberSchema as _NumberSchema } from "yup";

declare module "yup" {
    interface NumberSchema {}
}

export { _NumberSchema as NumberSchema };
