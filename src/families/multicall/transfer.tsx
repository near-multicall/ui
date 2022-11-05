import { Form, useFormikContext } from "formik";
import { useEffect } from "react";
import { args as arx } from "../../shared/lib/args/args";
import { Call, CallError } from "../../shared/lib/call";
import { Multicall } from "../../shared/lib/contracts/multicall";
import { unit } from "../../shared/lib/converter";
import { STORAGE } from "../../shared/lib/persistent";
import { CheckboxField, TextField, UnitField } from "../../shared/ui/form-fields";
import { BaseTask, BaseTaskProps, DefaultFormData } from "../base";
import { DynamicFeedOutlined } from "@mui/icons-material";
import "./multicall.scss";

type FormData = DefaultFormData & {
    accountId: string;
    amount: string;
    amountUnit: number | unit;
    transferAll: boolean;
};

export class Transfer extends BaseTask<FormData> {
    override uniqueClassName = "multicall-transfer-task";
    override schema = arx
        .object()
        .shape({
            addr: arx.string().multicall(),
            gas: arx.big().gas(),
            accountId: arx.string().address(),
            amount: arx.big().token(),
        })
        .transform(({ gas, gasUnit, amount, amountUnit, transferAll, ...rest }) => ({
            ...rest,
            gas: arx.big().intoParsed(gasUnit).cast(gas),
            // If transferAll, then amount takes a valid dummy value to silence errors.
            amount: transferAll ? 0 : arx.big().intoParsed(amountUnit).cast(amount),
        }))
        .requireAll()
        .retainAll();

    override initialValues: FormData = {
        name: "Transfer Near",
        addr: STORAGE.addresses.multicall,
        func: "near_transfer",
        gas: "3.5",
        gasUnit: "Tgas",
        depo: "1",
        depoUnit: "yocto",
        accountId: "",
        amount: "0",
        amountUnit: "NEAR",
        transferAll: false,
    };

    constructor(props: BaseTaskProps) {
        super(props);
        this._constructor();
    }

    protected override init(
        call: Call<{
            account_id: string;
            amount: string;
        }> | null
    ): void {
        if (call !== null) {
            const fromCall = {
                addr: call.address,
                func: call.actions[0].func,
                gas: arx.big().intoFormatted(this.initialValues.gasUnit).cast(call.actions[0].gas).toFixed(),
                accountId: call.actions[0].args.account_id,
                amount:
                    arx
                        .big()
                        .intoFormatted(this.initialValues.amountUnit)
                        .cast(call.actions[0].args.amount)
                        ?.toFixed() ?? null,
                transferAll: call.actions[0].args.amount === undefined,
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
        return (
            !!json &&
            arx.string().address().isValidSync(json.address) &&
            json.address.endsWith(Multicall.FACTORY_ADDRESS) &&
            json.actions[0].func === "near_transfer"
        );
    }

    public override toCall(): Call {
        const { addr, func, gas, gasUnit, depo, accountId, amount, amountUnit, transferAll } = this.state.formData;

        if (!arx.big().isValidSync(gas)) throw new CallError("Failed to parse gas input value", this.props.id);
        if (!arx.big().isValidSync(amount)) throw new CallError("Failed to parse amount input value", this.props.id);

        return {
            address: addr,
            actions: [
                {
                    func,
                    args: transferAll
                        ? {
                              account_id: accountId,
                          }
                        : {
                              account_id: accountId,
                              amount: arx.big().intoParsed(amountUnit).cast(amount).toFixed(),
                          },
                    gas: arx.big().intoParsed(gasUnit).cast(gas).toFixed(),
                    depo,
                },
            ],
        };
    }

    protected override onAddressesUpdated(e: CustomEvent<{ multicall: string }>): void {
        this.setFormData({ addr: e.detail.multicall });
        window.EDITOR.forceUpdate();
        this.forceUpdate();
    }

    public override Editor = (): React.ReactNode => {
        const { resetForm, validateForm, values } = useFormikContext<FormData>();

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
                    name="accountId"
                    label="Receiver Address"
                    roundtop
                />
                <CheckboxField
                    name="transferAll"
                    label="Transfer all available funds"
                    checked={values.transferAll}
                />
                {!values.transferAll && (
                    <UnitField
                        name="amount"
                        unit="amountUnit"
                        options={["NEAR", "yocto"]}
                        label="Transfer amount"
                    />
                )}
                <UnitField
                    name="gas"
                    unit="gasUnit"
                    options={["Tgas", "gas"]}
                    label="Allocated gas"
                    roundbottom
                />
                <a
                    className="protocol"
                    href="https://multicall.app"
                >
                    <span>powered by</span>
                    <DynamicFeedOutlined className="logo" />
                    <span>near-multicall</span>
                </a>
            </Form>
        );
    };
}
