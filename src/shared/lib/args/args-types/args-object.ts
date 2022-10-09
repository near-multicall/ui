import { addMethod, AnySchema, array, BaseSchema, object, ObjectSchema as _ObjectSchema, reach } from "yup";
import { StringSchema } from "./args-string";
import { BigSchema } from "./args-big";
import { Base64 } from "js-base64";
import { addErrorMethods, ErrorMethods } from "../args-error";

declare module "yup" {
    interface ObjectSchema<TShape, TContext, TIn, TOut> extends BaseSchema<TIn, TContext, TOut>, ErrorMethods {
        requireAll(): this;
        retainAll(): this;
        // call(): this;
        // intoJsonString(): this;
        // intoBase64String(): this;
        // intoCallString(): this;
    }
}

// // ensure input value is valid call
// addMethod(_ObjectSchema, "call", function call() {
//     const args = {
//         string: () => new StringSchema(),
//         big: () => new BigSchema(),
//         array,
//         object,
//     };
//     return this.shape({
//         address: args.string().address().required(),
//         actions: args.array().of(
//             args.object().shape({
//                 func: args.string().not([""]),
//                 args: args.object(),
//                 gas: args.big().gas(),
//                 depo: args.big().token("NEAR"),
//             })
//         ),
//     });
// });

// // make json string from input value
// addMethod(_ObjectSchema, "intoJsonString", function intoJsonString() {
//     return this.transform((value) => JSON.stringify(value));
// });

// // base64 encode input value
// addMethod(_ObjectSchema, "intoBase64String", function intoBase64String() {
//     return this.transform((value) => y);
// });

// // encode input value into json string, where args are encoded in base64
// addMethod(_ObjectSchema, "intoCallString", function intoCallString() {
//     return this.call().transform((value) => {
//         const _value = value;
//         _value.actions.forEach((a: { args: object | string }) => (a.args = Base64.encode(JSON.stringify(a.args))));
//         return JSON.stringify(_value);
//     });
// });

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

function fields(schema: _ObjectSchema<any>, path: string = ""): Record<string, _ObjectSchema<any>> {
    return reach(schema, path).fields;
}

export { _ObjectSchema as ObjectSchema, fields };
