import { Form, useFormikContext } from "formik";
import { useEffect } from "react";
import { args as arx } from "../../shared/lib/args/args";
import { Call, CallError } from "../../shared/lib/call";
import { GetAccountInfoResult, MetaPool } from "../../shared/lib/contracts/meta-pool";
import { InfoField, TextField, UnitField } from "../../shared/ui/form-fields";
import { BaseTask, BaseTaskProps, BaseTaskState, DefaultFormData } from "../base";
import * as MetaPoolLogo from "../../app/static/meta-pool/MetaPool_logo.png";
import "./meta-pool.scss";
import { STORAGE } from "../../shared/lib/persistent";

type FormData = DefaultFormData;

type Props = BaseTaskProps;

type State = BaseTaskState<FormData> & {
    metaPoolAccountInfo: GetAccountInfoResult | null;
};

export class NslpAddLiquidity extends BaseTask<FormData, Props, State> {
    override uniqueClassName = "meta-pool-nslp-add-liquidity-task";
    override schema = arx
        .object()
        .shape({
            gas: arx.big().gas(),
            depo: arx.big().token().min("1000000000000000000000000", "a minimum of 1 NEAR is required"),
        })
        .transform(({ gas, gasUnit, depo, depoUnit, ...rest }) => ({
            ...rest,
            gas: arx.big().intoParsed(gasUnit).cast(gas),
            depo: arx.big().intoParsed(depoUnit).cast(depo),
        }))
        .requireAll()
        .retainAll();

    override initialValues: FormData = {
        name: "Add Liquidity",
        addr: MetaPool.FACTORY_ADDRESS,
        func: "nslp_add_liquidity",
        gas: "20",
        gasUnit: "Tgas",
        depo: "",
        depoUnit: "NEAR",
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
        return (
            !!json &&
            json.actions.length === 1 &&
            json.address === MetaPool.FACTORY_ADDRESS &&
            json.actions[0].func === "nslp_add_liquidity"
        );
    }

    public override toCall(): Call {
        const { addr, func, gas, gasUnit, depo, depoUnit } = this.state.formData;

        if (!arx.big().isValidSync(gas)) throw new CallError("Failed to parse gas input value", this.props.id);
        if (!arx.big().isValidSync(depo)) throw new CallError("Failed to parse deposit value", this.props.id);

        return {
            address: addr,
            actions: [
                {
                    func,
                    args: {},
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

    public override Editor = (): React.ReactNode => {
        const { resetForm, validateForm } = useFormikContext();
        const { metaPoolAccountInfo } = this.state;

        useEffect(() => {
            resetForm({
                values: this.state.formData,
                touched: Object.keys(this.state.formData).reduce((acc, k) => ({ ...acc, [k]: true }), {}),
            });
            validateForm(this.state.formData);
            this.confidentlyUpdateMetaPoolAccount();
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
                                .intoFormatted("NEAR", 5)
                                .cast(metaPoolAccountInfo.nslp_shares)} LP shares`}</span>
                        </p>
                        <p className="entry">
                            <span className="key"></span>
                            <span className="value">{`= ${arx
                                .big()
                                .intoFormatted("NEAR", 5)
                                .cast(metaPoolAccountInfo.nslp_share_value)} \u24C3`}</span>
                        </p>
                    </InfoField>
                )}
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
