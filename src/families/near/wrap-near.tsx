import { Form, FormikErrors, useFormikContext } from "formik";
import { useEffect } from "react";
import { args as arx } from "../../shared/lib/args/args";
import { fields } from "../../shared/lib/args/args-types/args-object";
import { Call, CallError } from "../../shared/lib/call";
import { Big, toGas } from "../../shared/lib/converter";
import { STORAGE } from "../../shared/lib/persistent";
import { StorageManagement } from "../../shared/lib/standards/storageManagement";
import { viewAccount } from "../../shared/lib/wallet";
import { InfoField, TextField, UnitField } from "../../shared/ui/form";
import type { DefaultFormData } from "../base";
import { BaseTask, BaseTaskProps, BaseTaskState } from "../base";
import "./near.scss";

type FormData = DefaultFormData;

type Props = BaseTaskProps;

type State = BaseTaskState<FormData> & {
    neededStorage: string;
    multicallBalance: string;
    daoBalance: string;
};

export class WrapNear extends BaseTask<FormData, Props, State> {
    override uniqueClassName = "near-wrap-task";
    override schema = arx
        .object()
        .shape({
            gas: arx.big().gas().min(toGas("3.5"), "minimum 3.5 Tgas").max(toGas("250"), "maximum 250 Tgas"),
            depo: arx.big().token().min("1", "cannot wrap 0 NEAR"),
        })
        .transform(({ gas, gasUnit, depo, depoUnit, ...rest }) => ({
            ...rest,
            gas: arx.big().intoParsed(gasUnit).cast(gas),
            depo: arx.big().intoParsed(depoUnit).cast(depo),
        }))
        .requireAll()
        .retainAll();

    override initialValues: FormData = {
        name: "Wrap NEAR",
        addr: window.nearConfig.WNEAR_ADDRESS,
        func: "near_deposit",
        gas: "25",
        gasUnit: "Tgas",
        depo: "0",
        depoUnit: "NEAR",
    };

    constructor(props: Props) {
        super(props);
        this._constructor();

        this.state = {
            ...this.state,
            neededStorage: "0",
            multicallBalance: "0",
            daoBalance: "0",
        };

        this.tryUpdateStorageInfo().catch(() => {});
    }

    protected override init(call: Call<{}> | null): void {
        if (call !== null) {
            const fromCall = {
                addr: call.address,
                func: call.actions[0].func,
                gas: arx.big().intoFormatted(this.initialValues.gasUnit).cast(call.actions[0].gas).toFixed(),
                depo: arx.big().intoFormatted(this.initialValues.depoUnit).cast(call.actions[0].depo).toFixed(),
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
        return !!json && json.actions[0].func === "near_deposit" && json.address === window.nearConfig.WNEAR_ADDRESS;
    }

    public override toCall(): Call {
        const { addr, func, gas, gasUnit, depo, depoUnit } = this.state.formData;
        const { neededStorage } = this.state;

        if (!arx.big().isValidSync(gas)) throw new CallError("Failed to parse gas input value", this.props.id);
        if (!arx.big().isValidSync(depo)) throw new CallError("Failed to parse deposit input value", this.props.id);

        return {
            address: addr,
            actions: [
                {
                    func,
                    args: {},
                    gas: arx.big().intoParsed(gasUnit).cast(gas).toFixed(),
                    depo: arx.big().intoParsed(depoUnit).cast(depo).add(neededStorage).toFixed(),
                },
            ],
        };
    }

    private tryUpdateStorageInfo(): Promise<boolean> {
        return new Promise<boolean>((resolve) => {
            this.schema.check(this.state.formData).then(() => {
                this.confidentlyUpdateStorageInfo().then((ready) => resolve(ready));
            });
        });
    }

    private async confidentlyUpdateStorageInfo(): Promise<boolean> {
        const { addr } = this.state.formData;
        const storageManager = new StorageManagement(addr);
        const [balance, bounds, multicallAccount, daoAcccount] = await Promise.all([
            storageManager.storageBalanceOf(STORAGE.addresses.multicall),
            storageManager.storageBalanceBounds(),
            viewAccount(STORAGE.addresses.multicall),
            viewAccount(STORAGE.addresses.dao),
        ]);
        this.setState({
            multicallBalance: multicallAccount.amount,
            daoBalance: daoAcccount.amount,
            // P.S.: wNEAR has min=max for storage bounds
            neededStorage: Big(bounds.min).minus(balance.total).toFixed(),
        });
        return true;
    }

    public override async validateForm(values: FormData): Promise<FormikErrors<FormData>> {
        this.setFormData(values);
        await new Promise((resolve) => this.resolveDebounced(resolve));
        this.tryUpdateStorageInfo();
        await this.schema.check(values);
        return Object.fromEntries(
            Object.entries(fields(this.schema))
                .map(([k, v]) => [k, v?.message() ?? ""])
                .filter(([_, v]) => v !== "")
        );
    }

    protected override onAddressesUpdated(e: CustomEvent<{ dao: string; multicall: string; user: string }>): void {
        this.tryUpdateStorageInfo();
    }

    public override Editor = (): React.ReactNode => {
        const { resetForm, validateForm } = useFormikContext();
        const { multicallBalance, daoBalance, neededStorage } = this.state;

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
                            .cast(multicallBalance)} NEAR`}</span>
                    </p>
                    <p className="entry">
                        <span className="key">DAO balance</span>
                        <span className="value">{`${arx.big().intoFormatted("NEAR", 5).cast(daoBalance)} NEAR`}</span>
                    </p>
                    {Big(neededStorage).gt("0") && (
                        <p className="entry warn">
                            <span className="key">Storage deposit added</span>
                            <span className="value">{`${arx
                                .big()
                                .intoFormatted("NEAR", 5)
                                .cast(neededStorage)} Ⓝ`}</span>
                        </p>
                    )}
                </InfoField>
                <UnitField
                    name="depo"
                    unit="depoUnit"
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
