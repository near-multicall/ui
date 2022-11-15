import { Form, useFormikContext } from "formik";
import { useEffect } from "react";
import { args as arx } from "../../shared/lib/args/args";
import { Call, CallError } from "../../shared/lib/call";
import { GetAccountInfoResult, MetaPool } from "../../shared/lib/contracts/meta-pool";
import { CheckboxField, InfoField, TextField, UnitField } from "../../shared/ui/form-fields";
import { BaseTask, BaseTaskProps, BaseTaskState, DefaultFormData } from "../base";
import * as MetaPoolLogo from "../../app/static/meta-pool/MetaPool_logo.png";
import "./meta-pool.scss";
import { STORAGE } from "../../shared/lib/persistent";
import { Big, unit } from "../../shared/lib/converter";
import { fields } from "../../shared/lib/args/args-types/args-object";

type FormData = DefaultFormData & {
    amount: string;
    amountUnit: unit | number;
    removeAll: boolean;
};

type Props = BaseTaskProps;

type State = BaseTaskState<FormData> & {
    metaPoolAccountInfo: GetAccountInfoResult | null;
};

export class NslpRemoveLiquidity extends BaseTask<FormData, Props, State> {
    override uniqueClassName = "meta-pool-nslp-remove-liquidity-task";
    override schema = arx
        .object()
        .shape({
            gas: arx.big().gas(),
            amount: arx
                .big()
                .token()
                .test({
                    name: "dynamic max",
                    message: "You don't own this many LP shares",
                    test: (value, ctx) => {
                        if (value == null || ctx.options.context?.metaPoolAccountInfo?.nslp_shares == null) return true;
                        try {
                            if (Big(value).gt(ctx.options.context.metaPoolAccountInfo.nslp_shares)) return false;
                        } catch (e) {}
                        return true;
                    },
                })
                .requiredWhen("removeAll", (removeAll) => !removeAll),
        })
        .transform(({ gas, gasUnit, amount, amountUnit, removeAll, ...rest }) => ({
            ...rest,
            removeAll,
            gas: arx.big().intoParsed(gasUnit).cast(gas),
            amount: removeAll ? null : arx.big().intoParsed(amountUnit).cast(amount),
        }))
        .requireAll()
        .retainAll();

    override initialValues: FormData = {
        name: "Remove Liquidity",
        addr: MetaPool.FACTORY_ADDRESS,
        func: "nslp_remove_liquidity",
        gas: "20",
        gasUnit: "Tgas",
        depo: "0",
        depoUnit: "NEAR",
        amount: "0",
        amountUnit: "NEAR",
        removeAll: false,
    };

    constructor(props: BaseTaskProps) {
        super(props);
        this._constructor();
        this.state = {
            ...this.state,
            metaPoolAccountInfo: null,
        };

        this.confidentlyUpdateMetaPoolAccount();
    }

    protected override init(call: Call<{ amount: string }> | null): void {
        if (call !== null) {
            const fromCall = {
                addr: call.address,
                func: call.actions[0].func,
                gas: arx.big().intoFormatted(this.initialValues.gasUnit).cast(call.actions[0].gas).toFixed(),
                depo: arx.big().intoFormatted(this.initialValues.depoUnit).cast(call.actions[0].depo).toFixed(),
                amount: arx
                    .big()
                    .intoFormatted(this.initialValues.amountUnit)
                    .cast(call.actions[0].args.amount)
                    .toFixed(),
            };
            this.initialValues = Object.keys(this.initialValues).reduce((acc, k) => {
                const v = fromCall[k as keyof typeof fromCall];
                return v !== null && v !== undefined ? { ...acc, [k as keyof FormData]: v } : acc;
            }, this.initialValues);
        }

        this.state = { ...this.state, formData: this.initialValues };
        this.schema.check(this.state.formData, { context: { metaPoolAccountInfo: this.state.metaPoolAccountInfo } });
    }

    static override inferOwnType(json: Call): boolean {
        return (
            !!json &&
            json.actions.length === 1 &&
            json.address === MetaPool.FACTORY_ADDRESS &&
            json.actions[0].func === "nslp_remove_liquidity"
        );
    }

    public override toCall(): Call {
        const { addr, func, gas, gasUnit, depo, depoUnit, amount, amountUnit, removeAll } = this.state.formData;

        if (!arx.big().isValidSync(gas)) throw new CallError("Failed to parse gas input value", this.props.id);
        if (!arx.big().isValidSync(depo)) throw new CallError("Failed to parse deposit value", this.props.id);
        if (removeAll && this.state.metaPoolAccountInfo?.nslp_shares === undefined)
            throw new CallError("Lacking metadata", this.props.id);
        if (!removeAll && !arx.big().isValidSync(amount))
            throw new CallError("Failed to parse amount value", this.props.id);

        return {
            address: addr,
            actions: [
                {
                    func,
                    args: {
                        amount: removeAll
                            ? this.state.metaPoolAccountInfo!.nslp_shares
                            : arx.big().intoParsed(amountUnit).cast(amount).toFixed(),
                    },
                    gas: arx.big().intoParsed(gasUnit).cast(gas).toFixed(),
                    depo: arx.big().intoParsed(depoUnit).cast(depo).toFixed(),
                },
            ],
        };
    }

    private async confidentlyUpdateMetaPoolAccount(): Promise<boolean> {
        const { addr } = this.state.formData;
        const metaPoolAccountInfo = await new MetaPool(addr).getAccountInfo(STORAGE.addresses.multicall);
        this.setState({ metaPoolAccountInfo: metaPoolAccountInfo ?? null });
        window.EDITOR.forceUpdate();
        return !!metaPoolAccountInfo;
    }

    public override async validateForm(values: FormData): Promise<FormikErrors<FormData>> {
        this.setFormData(values);
        await new Promise((resolve) => this.resolveDebounced(resolve));
        await this.schema.check(values, { context: { metaPoolAccountInfo: this.state.metaPoolAccountInfo } });
        return Object.fromEntries(
            Object.entries(fields(this.schema))
                .map(([k, v]) => [k, v?.message() ?? ""])
                .filter(([_, v]) => v !== "")
        );
    }

    public override Editor = (): React.ReactNode => {
        const { resetForm, validateForm, values } = useFormikContext<FormData>();
        const { metaPoolAccountInfo } = this.state;

        useEffect(() => {
            resetForm({
                values: this.state.formData,
                touched: Object.keys(this.state.formData).reduce((acc, k) => ({ ...acc, [k]: true }), {}),
            });
            validateForm(this.state.formData);
        }, []);

        return (
            <Form className={`edit ${this.uniqueClassName}-edit`}>
                <TextField
                    name="name"
                    label="Card Name"
                    variant="standard"
                    autoFocus
                />
                <div className="empty-line" />
                {!!metaPoolAccountInfo && (
                    <InfoField roundtop>
                        <p className="entry">
                            <span className="key">You own</span>
                            <span className="value">{`${arx
                                .big()
                                .intoFormatted("NEAR")
                                .cast(metaPoolAccountInfo.nslp_shares)} LP shares`}</span>
                        </p>
                        <p className="entry">
                            <span className="key"></span>
                            <span className="value">{`= ${arx
                                .big()
                                .intoFormatted("NEAR")
                                .cast(metaPoolAccountInfo.nslp_share_value)} \u24C3`}</span>
                        </p>
                    </InfoField>
                )}
                <CheckboxField
                    name="removeAll"
                    label="Remove All"
                    checked={values.removeAll}
                />
                {!values.removeAll && (
                    <UnitField
                        name="amount"
                        unit="amountUnit"
                        options={["NEAR", "yocto"]}
                        label="Amount"
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
                    href="https://metapool.app/"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    <span>powered by</span>
                    <img
                        className="logo"
                        src={MetaPoolLogo}
                        alt="Meta Pool"
                    />
                </a>
            </Form>
        );
    };
}
