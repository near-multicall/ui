import { addMethod, AnySchema, array, BaseSchema, object, ObjectSchema as _ObjectSchema, reach } from "yup";
import { StringSchema } from "./args-string";
import { BigSchema } from "./args-big";
import { Base64 } from "js-base64";
import { addErrorMethods, ErrorMethods } from "../args-error";

declare module "yup" {
    interface ObjectSchema<TShape, TContext, TIn, TOut> extends BaseSchema<TIn, TContext, TOut>, ErrorMethods {
        requireAll(): this;
        retainAll(): this;
    }
}

/**
 * call .require() on all children
 */
addMethod(_ObjectSchema, "requireAll", function requireAll() {
    Object.entries(this.fields).forEach(
        ([key, field]) =>
            (this.fields[key] =
                (field as AnySchema).type === "object"
                    ? (this.fields[key] as any).requireAll()
                    : (this.fields[key] as AnySchema).required())
    );
    return this.required();
});

/**
 * call .retain() on all children
 */
addMethod(_ObjectSchema, "retainAll", function retainAll() {
    Object.entries(this.fields).forEach(
        ([key, field]) =>
            (this.fields[key] =
                (field as AnySchema).type === "object"
                    ? (this.fields[key] as any).retainAll()
                    : (this.fields[key] as any).retain())
    );
    return this.retain();
});

addErrorMethods(_ObjectSchema);

/**
 * get subschema at path
 * @param schema
 * @param path
 * @returns
 */
function fields(schema: _ObjectSchema<any>, path: string = ""): Record<string, _ObjectSchema<any>> {
    return reach(schema, path).fields;
}

export { _ObjectSchema as ObjectSchema, fields };
