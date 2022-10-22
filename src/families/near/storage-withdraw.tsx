import { InputAdornment } from "@mui/material";
import { Form, FormikErrors, useFormikContext } from "formik";
import { useEffect } from "react";
import { args as arx } from "../../shared/lib/args/args";
import { fields } from "../../shared/lib/args/args-types/args-object";
import { Call, CallError } from "../../shared/lib/call";
import { FungibleToken } from "../../shared/lib/standards/fungibleToken";
import { CheckboxField, TextField, UnitField } from "../../shared/ui/form-fields";
import { BaseTask, BaseTaskProps, BaseTaskState, DefaultFormData } from "./../base";
import "./near.scss";

type FormData = DefaultFormData & {
    amount: string;
    withdrawAll: boolean;
};

type Props = BaseTaskProps;

type State = BaseTaskState<FormData> & {
    token: FungibleToken;
};

export class StorageWithdraw extends BaseTask<FormData, Props, State> {
    override uniqueClassName = "near-storage-withdraw-task";
    override schema = arx
        .object()
        .shape({
            addr: arx.string().ft(),
            gas: arx.big().gas(),
            amount: arx.big().token(),
        })
        .transform(({ gas, gasUnit, ...rest }) => ({
            ...rest,
            gas: arx.big().intoParsed(gasUnit).cast(gas),
        }))
        .requireAll()
        .retainAll();

    override initialValues: FormData = {
        name: "Storage Withdraw",
        addr: window.nearConfig.WNEAR_ADDRESS,
        func: "storage_withdraw",
        gas: "7.5",
        gasUnit: "Tgas",
        depo: "1",
        depoUnit: "yocto",
        amount: "0",
        withdrawAll: true,
    };

    constructor(props: BaseTaskProps) {
        super(props);
        this._constructor();

        this.state = {
            ...this.state,
            token: new FungibleToken(this.initialValues.addr),
        };

        this.schema = this.schema.transform(({ amount, withdrawAll, ...rest }) => ({
            ...rest,
            amount: withdrawAll
                ? 0
                : this.state.token.ready
                ? arx.big().intoParsed(this.state.token.metadata.decimals).cast(amount)?.toFixed() ?? null
                : amount,
        }));

        this.tryUpdateFt().catch(() => {});
    }

    protected override init(
        call: Call<{
            amount: string;
        }> | null
    ): void {
        if (call !== null) {
            const fromCall = {
                addr: call.address,
                func: call.actions[0].func,
                gas: arx.big().intoFormatted(this.initialValues.gasUnit).cast(call.actions[0].gas).toFixed(),
                amount: call.actions[0].args.amount,
                withdrawAll: call.actions[0].args.amount === undefined,
            };

            this.initialValues = Object.keys(this.initialValues).reduce((acc, k) => {
                const v = fromCall[k as keyof typeof fromCall];
                return v !== null && v !== undefined ? { ...acc, [k as keyof FormData]: v } : acc;
            }, this.initialValues);
        }

        this.state = { ...this.state, formData: this.initialValues };
        this.schema.check(this.state.formData);

        if (call !== null)
            this.tryUpdateFt().then((res) =>
                this.setFormData({
                    amount: res
                        ? arx
                              .big()
                              .intoFormatted(this.state.token.metadata.decimals)
                              .cast(this.state.formData.amount)
                              .toFixed()
                        : this.state.formData.amount,
                })
            );
    }

    static override inferOwnType(json: Call): boolean {
        return (
            !!json && arx.string().address().isValidSync(json.address) && json.actions[0].func === "storage_withdraw"
        );
    }

    public override toCall(): Call {
        const { token } = this.state;
        const { addr, func, gas, gasUnit, depo, amount, withdrawAll } = this.state.formData;

        if (!arx.big().isValidSync(gas)) throw new CallError("Failed to parse gas input value", this.props.id);
        if (!arx.big().isValidSync(amount)) throw new CallError("Failed to parse amount input value", this.props.id);
        if (!token.ready) throw new CallError("Lacking token metadata", this.props.id);

        return {
            address: addr,
            actions: [
                {
                    func,
                    args: withdrawAll
                        ? {}
                        : {
                              amount: arx.big().intoParsed(token.metadata.decimals).cast(amount).toFixed(),
                          },
                    gas: arx.big().intoParsed(gasUnit).cast(gas).toFixed(),
                    depo,
                },
            ],
        };
    }

    private tryUpdateFt(): Promise<boolean> {
        return new Promise<boolean>((resolve) => {
            this.schema.check(this.state.formData).then(() => {
                const { addr } = fields(this.schema);
                if (!addr.isBad()) {
                    this.confidentlyUpdateFt().then((ready) => resolve(ready));
                } else {
                    this.setState({ token: new FungibleToken(this.state.formData.addr) }); // will be invalid
                    resolve(false);
                }
            });
        });
    }

    private async confidentlyUpdateFt(): Promise<boolean> {
        const { addr } = this.state.formData;
        const newToken = await FungibleToken.init(addr);
        this.setState({ token: newToken });
        window.EDITOR.forceUpdate();
        return newToken.ready;
    }

    public override async validateForm(values: FormData): Promise<FormikErrors<FormData>> {
        this.setFormData(values);
        await new Promise((resolve) => this.resolveDebounced(resolve));
        await this.tryUpdateFt();
        await this.schema.check(values);
        return Object.fromEntries(
            Object.entries(fields(this.schema))
                .map(([k, v]) => [k, v?.message() ?? ""])
                .filter(([_, v]) => v !== "")
        );
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
                    name="addr"
                    label="Token Address"
                    roundtop
                />
                <CheckboxField
                    name="withdrawAll"
                    label="Withdraw all available funds"
                    checked={values.withdrawAll}
                />
                {!values.withdrawAll && (
                    <TextField
                        name="amount"
                        label="Amount"
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">{this.state.token.metadata.symbol}</InputAdornment>
                            ),
                        }}
                    />
                )}
                <UnitField
                    name="gas"
                    unit="gasUnit"
                    options={["Tgas", "gas"]}
                    label="Allocated gas"
                    roundbottom
                />
            </Form>
        );
    };
}
