import { addMethod, array, BaseSchema, object, ObjectSchema } from "yup";
import { StringSchema } from "./args-string";
import { BigSchema } from "./args-big";
import { Base64 } from "js-base64";

declare module "yup" {
    interface ObjectSchema<TShape, TContext, TIn, TOut> extends BaseSchema<TIn, TContext, TOut> {
        call(): this;
        intoJsonString(): this;
        intoBase64String(): this;
        intoCallString(): this;
    }
}

// ensure input value is valid call
addMethod(ObjectSchema, "call", function call() {
    const args = {
        string: () => new StringSchema(),
        big: () => new BigSchema(),
        array,
        object,
    };
    return this.shape({
        address: args.string().address().required(),
        actions: args.array().of(
            args.object().shape({
                func: args.string().not([""]),
                args: args.object(),
                gas: args.big().gas(),
                depo: args.big().token("NEAR"),
            })
        ),
    });
});

// make json string from input value
addMethod(ObjectSchema, "intoJsonString", function intoJsonString() {
    return this.transform((value) => JSON.stringify(value));
});

// base64 encode input value
addMethod(ObjectSchema, "intoBase64String", function intoBase64String() {
    return this.transform((value) => Base64.encode(JSON.stringify(value)));
});

// base64 encode input value
addMethod(ObjectSchema, "intoCallString", function intoCallString() {
    return this.call().transform((value) => {
        const _value = value;
        _value.actions.forEach((a: { args: object | string }) => (a.args = Base64.encode(JSON.stringify(a.args))));
        return JSON.stringify(_value);
    });
});

export { ObjectSchema };
