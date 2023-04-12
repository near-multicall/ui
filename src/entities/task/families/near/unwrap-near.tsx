import { Form, FormikErrors, useFormikContext } from "formik";
import { useEffect } from "react";
import { args as arx } from "../../../../shared/lib/args/args";
import { fields } from "../../../../shared/lib/args/args-types/args-object";
import { Call, CallError } from "../../../../shared/lib/call";
import { toGas, unit } from "../../../../shared/lib/converter";
import { STORAGE } from "../../../../shared/lib/persistent";
import { FungibleToken } from "../../../../shared/lib/standards/fungibleToken";
import { TextField, UnitField, InfoField } from "../../../../shared/ui/form";
import { BaseTask, BaseTaskProps, BaseTaskState } from "../base";
import "./near.scss";

import type { DefaultFormData } from "../base";

type FormData = DefaultFormData & {
    amount: string;
    amountUnit: number | unit;
};

type Props = BaseTaskProps;

type State = BaseTaskState<FormData> & {
    multicallBalance: string;
    daoBalance: string;
};

export class UnwrapNear extends BaseTask<FormData, Props, State> {
    override uniqueClassName = "near-unwrap-task";
    override schema = arx
        .object()
        .shape({
            gas: arx.big().gas().min(toGas("3.5"), "minimum 3.5 Tgas").max(toGas("250"), "maximum 250 Tgas"),
            amount: arx.big().token().min("1", "cannot unwrap 0 NEAR"),
        })
        .transform(({ gas, gasUnit, amount, amountUnit, ...rest }) => ({
            ...rest,
            gas: arx.big().intoParsed(gasUnit).cast(gas),
            amount: arx.big().intoParsed(amountUnit).cast(amount),
        }))
        .requireAll()
        .retainAll();

    override initialValues: FormData = {
        name: "Unwrap NEAR",
        addr: window.nearConfig.WNEAR_ADDRESS,
        func: "near_withdraw",
        gas: "10",
        gasUnit: "Tgas",
        depo: "1",
        depoUnit: "yocto",
        amount: "0",
        amountUnit: "NEAR",
    };

    constructor(props: Props) {
        super(props);
        this._constructor();

        this.state = {
            ...this.state,
            multicallBalance: "0",
            daoBalance: "0",
        };

        this.tryUpdateBalances().catch(() => {});
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
                amount:
                    arx
                        .big()
                        .intoFormatted(this.initialValues.amountUnit)
                        .cast(call.actions[0].args.amount)
                        ?.toFixed() ?? null,
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
        return !!json && json.actions[0].func === "near_withdraw" && json.address === window.nearConfig.WNEAR_ADDRESS;
    }

    public override toCall(): Call {
        const { addr, func, gas, gasUnit, amount, amountUnit, depo } = this.state.formData;

        if (!arx.big().isValidSync(gas)) throw new CallError("Failed to parse gas input value", this.props.id);
        if (!arx.big().isValidSync(amount)) throw new CallError("Failed to parse amount input value", this.props.id);

        return {
            address: addr,
            actions: [
                {
                    func,
                    args: {
                        amount: arx.big().intoParsed(amountUnit).cast(amount).toFixed(),
                    },
                    gas: arx.big().intoParsed(gasUnit).cast(gas).toFixed(),
                    depo,
                },
            ],
        };
    }

    private tryUpdateBalances(): Promise<boolean> {
        return new Promise<boolean>((resolve) => {
            this.schema.check(this.state.formData).then(() => {
                this.confidentlyUpdateBalances().then((ready) => resolve(ready));
            });
        });
    }

    private async confidentlyUpdateBalances(): Promise<boolean> {
        const { addr } = this.state.formData;
        const wNear = new FungibleToken(addr);
        const [multicallBalance, daoBalance] = await Promise.all([
            wNear.ftBalanceOf(STORAGE.addresses.multicall),
            wNear.ftBalanceOf(STORAGE.addresses.dao),
        ]);
        this.setState({ multicallBalance, daoBalance });
        return true;
    }

    public override async validateForm(values: FormData): Promise<FormikErrors<FormData>> {
        this.setFormData(values);
        await new Promise((resolve) => this.resolveDebounced(resolve));
        this.tryUpdateBalances();
        await this.schema.check(values);
        return Object.fromEntries(
            Object.entries(fields(this.schema))
                .map(([k, v]) => [k, v?.message() ?? ""])
                .filter(([_, v]) => v !== "")
        );
    }

    protected override onAddressesUpdated(e: CustomEvent<{ dao: string; multicall: string; user: string }>): void {
        this.tryUpdateBalances();
    }

    public override Editor = (): React.ReactNode => {
        const { resetForm, validateForm } = useFormikContext();
        const { multicallBalance, daoBalance } = this.state;

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
                <InfoField roundtop>
                    <p className="entry">
                        <span className="key">Multicall balance</span>
                        <span className="value">{`${arx
                            .big()
                            .intoFormatted("NEAR", 5)
                            .cast(multicallBalance)} wNEAR`}</span>
                    </p>
                    <p className="entry">
                        <span className="key">DAO balance</span>
                        <span className="value">{`${arx.big().intoFormatted("NEAR", 5).cast(daoBalance)} wNEAR`}</span>
                    </p>
                </InfoField>
                <UnitField
                    name="amount"
                    unit="amountUnit"
                    options={["NEAR", "yocto"]}
                    label="Amount"
                />
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
