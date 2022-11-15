import { Form, FormikErrors, useFormikContext } from "formik";
import { useEffect } from "react";
import { args as arx } from "../../shared/lib/args/args";
import { fields } from "../../shared/lib/args/args-types/args-object";
import { Call, CallError } from "../../shared/lib/call";
import { unit } from "../../shared/lib/converter";
import { STORAGE } from "../../shared/lib/persistent";
import { StorageManagement, StorageBalance } from "../../shared/lib/standards/storageManagement";
import { CheckboxField, InfoField, TextField, UnitField } from "../../shared/ui/forms";
import { BaseTask, BaseTaskProps, BaseTaskState, DefaultFormData } from "./../base";
import "./near.scss";

type FormData = DefaultFormData & {
    amount: string;
    amountUnit: unit | number;
    withdrawAll: boolean;
};

type Props = BaseTaskProps;

type State = BaseTaskState<FormData> & {
    storageManagement: StorageManagement | null;
    storageBalance: StorageBalance | null;
};

export class StorageWithdraw extends BaseTask<FormData, Props, State> {
    override uniqueClassName = "near-storage-withdraw-task";
    override schema = arx
        .object()
        .shape({
            addr: arx.string().contract(),
            gas: arx.big().gas(),
            amount: arx
                .big()
                .token()
                .min("1", "cannot withdraw 0 NEAR")
                .test({
                    name: "dynamic max",
                    message: "amount is exceeding available amount",
                    test: (value, ctx) =>
                        value == null ||
                        ctx.options.context?.withdrawable == null ||
                        value.lte(ctx.options.context.withdrawable),
                }),
        })
        .transform(({ gas, gasUnit, amount, amountUnit, withdrawAll, ...rest }) => ({
            ...rest,
            gas: arx.big().intoParsed(gasUnit).cast(gas),
            amount: withdrawAll ? 0 : arx.big().intoParsed(amountUnit).cast(amount)?.toFixed() ?? null,
        }))
        .requireAll()
        .retainAll();

    override initialValues: FormData = {
        name: "Storage Withdraw",
        addr: window.nearConfig.WNEAR_ADDRESS,
        func: "storage_withdraw",
        gas: "12.5",
        gasUnit: "Tgas",
        depo: "1",
        depoUnit: "yocto",
        amount: "0",
        amountUnit: "NEAR",
        withdrawAll: true,
    };

    constructor(props: BaseTaskProps) {
        super(props);
        this._constructor();

        this.state = {
            ...this.state,
            storageManagement: new StorageManagement(this.initialValues.addr),
            storageBalance: null,
        };

        this.tryUpdateSm().catch(() => {});
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
        this.schema.check(this.state.formData, { context: { withdrawable: this.state.storageBalance?.available } });

        if (call !== null)
            this.tryUpdateSm().then((res) =>
                this.setFormData({
                    amount: res
                        ? arx
                              .big()
                              .intoFormatted(this.state.formData.amountUnit)
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
        const { addr, func, gas, gasUnit, depo, amount, amountUnit, withdrawAll } = this.state.formData;

        if (!arx.big().isValidSync(gas)) throw new CallError("Failed to parse gas input value", this.props.id);
        if (!withdrawAll && !arx.big().isValidSync(amount))
            throw new CallError("Failed to parse amount input value", this.props.id);

        return {
            address: addr,
            actions: [
                {
                    func,
                    args: withdrawAll
                        ? {}
                        : {
                              amount: arx.big().intoParsed(amountUnit).cast(amount).toFixed(),
                          },
                    gas: arx.big().intoParsed(gasUnit).cast(gas).toFixed(),
                    depo,
                },
            ],
        };
    }

    private tryUpdateSm(): Promise<boolean> {
        return new Promise<boolean>((resolve) => {
            this.schema
                .check(this.state.formData, { context: { withdrawable: this.state.storageBalance?.available } })
                .then(() => {
                    const { addr } = fields(this.schema);
                    if (!addr.isBad()) {
                        this.confidentlyUpdateSm().then(() => resolve(true));
                    } else {
                        this.setState({
                            storageManagement: null,
                            storageBalance: null,
                        });
                        resolve(false);
                    }
                });
        });
    }

    private async confidentlyUpdateSm(): Promise<boolean> {
        const { addr } = this.state.formData;
        const storageManagement = new StorageManagement(addr);
        const storageBalance = await storageManagement.storageBalanceOf(STORAGE.addresses.multicall);
        this.setState({ storageManagement, storageBalance });
        window.EDITOR.forceUpdate();
        return true;
    }

    public override async validateForm(values: FormData): Promise<FormikErrors<FormData>> {
        this.setFormData(values);
        await new Promise((resolve) => this.resolveDebounced(resolve));
        await this.tryUpdateSm();
        return Object.fromEntries(
            Object.entries(fields(this.schema))
                .map(([k, v]) => [k, v?.message() ?? ""])
                .filter(([_, v]) => v !== "")
        );
    }

    public override Editor = (): React.ReactNode => {
        const { resetForm, validateForm, values } = useFormikContext<FormData>();
        const { storageBalance } = this.state;
        const balance = arx.big().intoFormatted("NEAR").cast(storageBalance?.available);

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
                {!!balance && <InfoField>{`Current available storage balance: ${balance} Ⓝ`}</InfoField>}
                <CheckboxField
                    name="withdrawAll"
                    label="Withdraw all available funds"
                    checked={values.withdrawAll}
                />
                {!values.withdrawAll && (
                    <UnitField
                        name="amount"
                        label="Amount"
                        unit="amountUnit"
                        options={["NEAR", "yocto"]}
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
