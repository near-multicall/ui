import { DeleteOutline, EditOutlined, MoveDown } from "@mui/icons-material";
import clsx from "clsx";
import { Form, useFormikContext } from "formik";
import { useEffect } from "react";
import { args as arx } from "../shared/lib/args/args";
import { Call, CallError } from "../shared/lib/call";
import { Tooltip } from "../shared/ui/components";
import { TextField, UnitField } from "../shared/ui/form-fields";
import { BaseTask, BaseTaskProps, DefaultFormData, DisplayData } from "./base";
import "./custom.scss";

type FormData = DefaultFormData & {
    args: string;
};

export class CustomTask extends BaseTask<FormData> {
    override uniqueClassName = "custom-task";
    override schema = arx
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

    override initialValues: FormData = {
        name: "Custom",
        addr: "",
        func: "",
        gas: "0",
        gasUnit: "Tgas",
        depo: "0",
        depoUnit: "NEAR",
        args: "{}",
    };

    constructor(props: BaseTaskProps) {
        super(props);
        this._constructor();
    }

    protected override init(call: Call | null): void {
        if (call !== null) {
            const fromCall = {
                addr: call.address,
                func: call.actions[0].func,
                gas: arx.big().intoFormatted(this.initialValues.gasUnit).cast(call.actions[0].gas).toFixed(),
                depo: arx.big().intoFormatted(this.initialValues.depoUnit).cast(call.actions[0].depo).toFixed(),
                args: JSON.stringify(call.actions[0].args),
            };

            this.initialValues = Object.keys(this.initialValues).reduce((acc, k) => {
                const v = fromCall[k as keyof typeof fromCall];
                return v !== null && v !== undefined ? { ...acc, [k as keyof FormData]: v } : acc;
            }, this.initialValues);
        }

        this.state = { ...this.state, formData: this.initialValues };
        this.schema.check(this.state.formData);
    }

    static override inferOwnType(json: Call): boolean {
        return false;
    }

    public override toCall(): Call {
        const { addr, func, args, gas, gasUnit, depo, depoUnit } = this.state.formData;
        if (!arx.string().json().isValidSync(args))
            throw new CallError("Failed to parse function arguments", this.props.id);
        if (!arx.big().isValidSync(gas)) throw new CallError("Failed to parse gas input value", this.props.id);
        if (!arx.big().isValidSync(depo)) throw new CallError("Failed to parse deposit input value", this.props.id);
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

    public override Editor = (): React.ReactNode => {
        const { resetForm, validateForm } = useFormikContext();

        useEffect(() => {
            resetForm({
                values: this.state.formData,
                touched: Object.keys(this.state.formData).reduce((acc, k) => ({ ...acc, [k]: true }), {}),
            });
            validateForm(this.state.formData);
        }, []);

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
                    roundtop
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
                    roundbottom
                />
            </Form>
        );
    };

    protected override getDisplayData(): DisplayData {
        const { name, addr, func, gas, gasUnit, depo, depoUnit, args } = this.state.formData;
        return {
            name,
            addr,
            func,
            gas,
            gasUnit: gasUnit.toString(),
            depo,
            depoUnit: depoUnit.toString(),
            args: arx.string().json().isValidSync(args) ? JSON.stringify(JSON.parse(args), null, "  ") : args,
        };
    }
}
