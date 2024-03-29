import { addMethod, AnySchema, ObjectSchema as _ObjectSchema, reach } from "yup";
import { RetainOptions } from "../args-error";

declare module "yup" {
    interface ObjectSchema<TShape, TContext, TIn, TOut> {
        requireAll(options?: Partial<ApplyToAllOptions>): this;
        retainAll(options?: Partial<ApplyToAllOptions>, retainOptions?: Partial<RetainOptions>): this;
    }
}

interface ApplyToAllOptions {
    ignore: string[];
}

/**
 * call .require() on all children
 */
addMethod(_ObjectSchema, "requireAll", function requireAll(options?: Partial<ApplyToAllOptions>) {
    Object.entries(this.fields).forEach(([key, field]) =>
        !options?.ignore?.includes(key)
            ? (this.fields[key] =
                  (field as AnySchema).type === "object"
                      ? (this.fields[key] as any).requireAll()
                      : (this.fields[key] as AnySchema).required())
            : void 0
    );
    return this.required();
});

/**
 * call .retain() on all children
 */
addMethod(
    _ObjectSchema,
    "retainAll",
    function retainAll(options?: Partial<ApplyToAllOptions>, retainOptions?: Partial<RetainOptions>) {
        Object.entries(this.fields).forEach(([key, field]) =>
            !options?.ignore?.includes(key)
                ? (this.fields[key] =
                      (field as AnySchema).type === "object"
                          ? (this.fields[key] as any).retainAll()
                          : (this.fields[key] as any).retain(retainOptions))
                : void 0
        );

        return this.retain();
    }
);

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
