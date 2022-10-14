import { Form, Formik } from "formik";
import { args as arx } from "../shared/lib/args/args";
import { fields } from "../shared/lib/args/args-types/args-object";
import { Call, CallError } from "../shared/lib/call";
import { unit } from "../shared/lib/converter";
import { TextField, UnitField } from "../shared/ui/form-fields";
import { BaseTask } from "./base";
import "./custom.scss";

type FormData = {
    name: string;
    addr: string;
    func: string;
    args: string;
    gas: string;
    gasUnit: number | unit;
    depo: string;
    depoUnit: number | unit;
};

export class CustomTask extends BaseTask<FormData> {
    uniqueClassName = "custom-task";
    schema = arx
        .object()
        .shape({
            addr: arx.string().contract(),
            func: arx.string(),
            args: arx.string().json(),
            gas: arx.big().gas(),
            depo: arx.big().token(),
        })
        .transform(({ gas, gasUnit, depo, depoUnit, ...rest }) => ({
            ...rest,
            gas: arx.big().intoParsed(gasUnit).cast(gas),
            depo: arx.big().intoParsed(depoUnit).cast(depo),
        }))
        .requireAll()
        .retainAll();

    initialValues: FormData = {
        name: "Custom",
        addr: "",
        func: "",
        args: "{}",
        gas: "0",
        gasUnit: "Tgas",
        depo: "0",
        depoUnit: "NEAR",
    };

    init(call: Call | null) {
        if (call !== null) {
            const fromCall = {
                addr: call.address,
                func: call.actions[0].func,
                args: JSON.stringify(call.actions[0].args),
                gas: arx.big().intoFormatted(this.initialValues.gasUnit).cast(call.actions[0].gas).toFixed(),
                depo: arx.big().intoFormatted(this.initialValues.depoUnit).cast(call.actions[0].depo).toFixed(),
            };

            this.initialValues = Object.keys(this.initialValues).reduce(
                (result, key) =>
                    fromCall[key as keyof typeof fromCall] !== null &&
                    fromCall[key as keyof typeof fromCall] !== undefined
                        ? { ...result, [key as keyof FormData]: fromCall[key as keyof typeof fromCall] }
                        : result,

                this.initialValues
            );
        }

        this.state = { ...this.state, formData: this.initialValues };
        this.schema.check(this.state.formData);
    }

    static inferOwnType(json: Call) {
        return false;
    }

    toCall() {
        const { addr, func, args, gas, gasUnit, depo, depoUnit } = this.state.formData;
        if (!arx.string().json().isValidSync(args))
            throw new CallError("Failed to parse function arguments", this.props.id);
        return {
            address: addr,
            actions: [
                {
                    func,
                    args: JSON.parse(args),
                    gas: arx.big().intoParsed(gasUnit).cast(gas).toFixed(),
                    depo: arx.big().intoParsed(depoUnit).cast(depo).toFixed(),
                },
            ],
        };
    }

    onAddressesUpdated() {}

    renderEditor() {
        let init = true;
        return (
            <Formik
                initialValues={this.state.formData}
                initialTouched={Object.keys(this.state.formData).reduce((acc, k) => ({ ...acc, [k]: true }), {})}
                enableReinitialize={true}
                validate={async (values) => {
                    this.setFormData(values);
                    await new Promise((resolve) => this.resolveDebounced(resolve));
                    await this.schema.check(values);
                    return Object.fromEntries(
                        Object.entries(fields(this.schema))
                            .map(([k, v]) => [k, v?.message() ?? ""])
                            .filter(([_, v]) => v !== "")
                    );
                }}
                onSubmit={() => {}}
            >
                {({ resetForm, validateForm }) => {
                    if (init) {
                        resetForm({ values: this.state.formData });
                        validateForm(this.state.formData);
                        init = false;
                    }
                    return (
                        <Form className="edit">
                            <TextField
                                name="name"
                                label="Card Name"
                                variant="standard"
                                autoFocus
                            />
                            <div className="empty-line" />
                            <TextField
                                name="addr"
                                label="Contract Address"
                                roundTop
                            />
                            <TextField
                                name="func"
                                label="Function"
                            />
                            <TextField
                                name="args"
                                label="Function Arguments"
                            />
                            <UnitField
                                name="gas"
                                unit="gasUnit"
                                options={["Tgas", "gas"]}
                                label="Allocated gas"
                            />
                            <UnitField
                                name="depo"
                                unit="depoUnit"
                                options={["NEAR", "yocto"]}
                                label="Allocated deposit"
                                roundBottom
                            />
                        </Form>
                    );
                }}
            </Formik>
        );
    }
}
