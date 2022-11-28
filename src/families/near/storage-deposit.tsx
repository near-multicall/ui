import { Form, FormikErrors, useFormikContext } from "formik";
import { useEffect } from "react";
import { args as arx } from "../../shared/lib/args/args";
import { fields } from "../../shared/lib/args/args-types/args-object";
import { Call, CallError } from "../../shared/lib/call";
import { Big, unit } from "../../shared/lib/converter";
import { STORAGE } from "../../shared/lib/persistent";
import { StorageManagement, StorageBalance, StorageBalanceBounds } from "../../shared/lib/standards/storageManagement";
import { CheckboxField, InfoField, TextField, UnitField } from "../../shared/ui/form";
import { BaseTask, BaseTaskProps, BaseTaskState, DefaultFormData } from "./../base";
import "./near.scss";

type FormData = DefaultFormData & {
    accountId: string;
    registration_only: boolean;
};

type Props = BaseTaskProps;

type State = BaseTaskState<FormData> & {
    storageManagement: StorageManagement | null;
    storageBalance: StorageBalance | null;
    storageBalanceBounds: StorageBalanceBounds | null;
};

export class StorageDeposit extends BaseTask<FormData, Props, State> {
    override uniqueClassName = "near-storage-deposit-task";
    override schema = arx
        .object()
        .shape({
            addr: arx.string().contract(),
            gas: arx.big().gas(),
            depo: arx
                .big()
                .token()
                .test({
                    name: "dynamic min",
                    message: "amount is less than lower storage balance bound",
                    test: (value, ctx) =>
                        value == null ||
                        ctx.options.context?.lowerStorageBalanceBound == null ||
                        ctx.options.context?.storageBalance?.total == null ||
                        Big(value)
                            .add(ctx.options.context.storageBalance.total)
                            .gte(ctx.options.context.lowerStorageBalanceBound),
                })
                .test({
                    name: "dynamic max",
                    message: "amount is more than upper storage balance bound",
                    test: (value, ctx) =>
                        value == null ||
                        ctx.options.context?.upperStorageBalanceBound == null ||
                        ctx.options.context?.storageBalance?.total == null ||
                        Big(value)
                            .add(ctx.options.context.storageBalance.total)
                            .lte(ctx.options.context.upperStorageBalanceBound),
                }),
            accountId: arx.string().address(),
        })
        .transform(({ gas, gasUnit, depo, depoUnit, registration_only, ...rest }) => ({
            ...rest,
            gas: arx.big().intoParsed(gasUnit).cast(gas).toFixed(),
            depo: arx.big().intoParsed(depoUnit).cast(depo).toFixed(),
        }))
        .requireAll()
        .retainAll();

    override initialValues: FormData = {
        name: "Storage Deposit",
        addr: window.nearConfig.WNEAR_ADDRESS,
        func: "storage_deposit",
        gas: "7.5",
        gasUnit: "Tgas",
        depo: "0",
        depoUnit: "NEAR",
        accountId: STORAGE.addresses.multicall,
        registration_only: true,
    };

    constructor(props: BaseTaskProps) {
        super(props);
        this._constructor();

        this.state = {
            ...this.state,
            storageManagement: new StorageManagement(this.initialValues.addr),
            storageBalance: null,
            storageBalanceBounds: null,
        };
    }

    protected override init(
        call: Call<{
            account_id: string | null;
            registration_only: boolean | null;
        }> | null
    ): void {
        if (call !== null) {
            const fromCall = {
                addr: call.address,
                func: call.actions[0].func,
                gas: arx.big().intoFormatted(this.initialValues.gasUnit).cast(call.actions[0].gas).toFixed(),
                depo: arx.big().intoFormatted(this.initialValues.depoUnit).cast(call.actions[0].depo).toFixed(),
                accountId: call.actions[0].args?.account_id ?? STORAGE.addresses.multicall,
                registration_only: call.actions[0].args?.registration_only ?? true,
            };

            this.initialValues = Object.keys(this.initialValues).reduce((acc, k) => {
                const v = fromCall[k as keyof typeof fromCall];
                return v !== null && v !== undefined ? { ...acc, [k as keyof FormData]: v } : acc;
            }, this.initialValues);
        }

        this.state = { ...this.state, formData: this.initialValues };
        this.schema.check(this.state.formData, {
            context: {
                lowerStorageBalanceBound: this.state.storageBalanceBounds?.min,
                upperStorageBalanceBound: this.state.storageBalanceBounds?.max,
                storageBalance: this.state.storageBalance,
            },
        });

        this.tryUpdateSm().catch(() => {});
    }

    static override inferOwnType(json: Call): boolean {
        return (
            !!json &&
            arx.string().address().isValidSync(json.address) &&
            json.actions.length === 1 &&
            json.actions[0].func === "storage_deposit"
        );
    }

    public override toCall(): Call {
        const { addr, func, gas, gasUnit, depo, depoUnit, accountId, registration_only } = this.state.formData;

        if (!arx.big().isValidSync(gas)) throw new CallError("Failed to parse gas input value", this.props.id);
        if (!arx.big().isValidSync(depo)) throw new CallError("Failed to parse deposit input value", this.props.id);

        const amt =
            registration_only && !!this.state.storageBalanceBounds
                ? this.state.storageBalanceBounds.min
                : arx.big().intoParsed(depoUnit).cast(depo).toFixed();

        return {
            address: addr,
            actions: [
                {
                    func,
                    args: {
                        account_id: accountId,
                        ...(registration_only !== null && { registration_only }),
                    },
                    gas: arx.big().intoParsed(gasUnit).cast(gas).toFixed(),
                    depo: amt,
                },
            ],
        };
    }

    private tryUpdateSm(): Promise<boolean> {
        return new Promise<boolean>((resolve) => {
            this.schema
                .check(this.state.formData, {
                    context: {
                        lowerStorageBalanceBound: this.state.storageBalanceBounds?.min,
                        upperStorageBalanceBound: this.state.storageBalanceBounds?.max,
                        storageBalance: this.state.storageBalance,
                    },
                })
                .then(() => {
                    const { addr, accountId } = fields(this.schema);
                    if (!addr.isBad() && !accountId.isBad()) {
                        this.confidentlyUpdateSm().then(() => resolve(true));
                    } else {
                        this.setState({
                            storageManagement: null,
                            storageBalance: null,
                            storageBalanceBounds: null,
                        });
                        resolve(false);
                    }
                });
        });
    }

    private async confidentlyUpdateSm(): Promise<boolean> {
        const { addr, accountId } = this.state.formData;
        const storageManagement = new StorageManagement(addr);
        const [storageBalance, storageBalanceBounds] = await Promise.all([
            storageManagement.storageBalanceOf(accountId),
            storageManagement.storageBalanceBounds(),
        ]);
        this.setState({ storageManagement, storageBalance, storageBalanceBounds });
        window.EDITOR.forceUpdate();
        return true;
    }

    public override async validateForm(values: FormData): Promise<FormikErrors<FormData>> {
        if (this.state.storageBalanceBounds !== null && this.state.storageBalance !== null) {
            const missing = Big(this.state.storageBalanceBounds.min).sub(this.state.storageBalance.total);
            values.depo =
                values.registration_only && !!this.state.storageBalanceBounds
                    ? arx
                          .big()
                          .intoFormatted(values.depoUnit)
                          .cast(missing.gt(0) ? missing : 0)
                          .toFixed()
                    : values.depo;
        }
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
        const { storageBalance, storageBalanceBounds } = this.state;
        const balance = arx.big().intoFormatted("NEAR").cast(storageBalance?.total),
            lowerStorageBalanceBound = arx.big().intoFormatted("NEAR").cast(storageBalanceBounds?.min),
            upperStorageBalanceBound = arx.big().intoFormatted("NEAR").cast(storageBalanceBounds?.max);

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
                <TextField
                    name="accountId"
                    label="Account ID"
                />
                {!!balance && !!lowerStorageBalanceBound && (
                    <InfoField>
                        {`Current total storage balance: ${balance} Ⓝ`}
                        <br />
                        {`Minimum deposit: ${lowerStorageBalanceBound} Ⓝ`}
                        <br />
                        {!!upperStorageBalanceBound && (
                            <>
                                {`Maximum deposit: ${upperStorageBalanceBound} Ⓝ`}
                                <br />
                            </>
                        )}
                    </InfoField>
                )}
                <CheckboxField
                    name="registration_only"
                    label="Registration only"
                    checked={values.registration_only}
                />
                {!values.registration_only && (
                    <UnitField
                        name="depo"
                        label="Amount"
                        unit="depoUnit"
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
