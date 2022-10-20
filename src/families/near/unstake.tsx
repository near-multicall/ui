import { Form, FormikErrors, useFormikContext } from "formik";
import { useEffect } from "react";
import { args as arx } from "../../shared/lib/args/args";
import { fields } from "../../shared/lib/args/args-types/args-object";
import { Call, CallError } from "../../shared/lib/call";
import { toGas, unit, formatTokenAmount } from "../../shared/lib/converter";
import { StakingPool } from "../../shared/lib/contracts/staking-pool";
import { TextField, UnitField } from "../../shared/ui/form-fields";
import { BaseTask, BaseTaskProps, BaseTaskState } from "../base";
import "./near.scss";
import { STORAGE } from "../../shared/lib/persistent";

import type { DefaultFormData } from "../base";
import type { HumanReadableAccount } from "../../shared/lib/contracts/staking-pool";

type FormData = DefaultFormData & {
    amount: string;
    amountUnit: number | unit;
};

type Props = BaseTaskProps;

type State = BaseTaskState<FormData> & {
    pool: StakingPool;
    StakeInfo: HumanReadableAccount;
};

export class Unstake extends BaseTask<FormData, Props, State> {
    override uniqueClassName = "near-unstake-task";
    override schema = arx
        .object()
        .shape({
            addr: arx.string().stakingPool(),
            gas: arx.big().gas().min(toGas("3.5")).max(toGas("250")),
            amount: arx.big().token().min("1", "cannot unstake 0 NEAR"),
        })
        .transform(({ gas, gasUnit, amount, amountUnit, ...rest }) => ({
            ...rest,
            gas: arx.big().intoParsed(gasUnit).cast(gas),
            amount: arx.big().intoParsed(amountUnit).cast(amount),
        }))
        .requireAll()
        .retainAll();

    override initialValues: FormData = {
        name: "Unstake",
        addr: "",
        func: "unstake",
        gas: "20",
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
            pool: new StakingPool(this.initialValues.addr),
        };

        this.tryUpdateStakingPool().catch(() => {});
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
        return !!json && json.actions[0].func === "unstake";
    }

    public override toCall(): Call {
        const { addr, func, gas, gasUnit, depo, amount, amountUnit } = this.state.formData;

        if (!arx.big().isValidSync(gas)) throw new CallError("Failed to parse gas input value", this.props.id);
        if (!arx.big().isValidSync(depo)) throw new CallError("Failed to parse deposit input value", this.props.id);

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

    private tryUpdateStakingPool(): Promise<boolean> {
        return new Promise<boolean>((resolve) => {
            this.schema.check(this.state.formData).then(() => {
                const { addr } = fields(this.schema);
                if (!addr.isBad()) {
                    this.confidentlyUpdateStakingPool().then((ready) => resolve(ready));
                } else {
                    this.setState({ pool: new StakingPool(this.state.formData.addr) }); // will be invalid
                    resolve(false);
                }
            });
        });
    }

    private async confidentlyUpdateStakingPool(): Promise<boolean> {
        const { addr } = this.state.formData;
        const [stakingPool, multicallStakeInfo] = await Promise.all([
            StakingPool.init(addr),
            new StakingPool(addr).getAccount(STORAGE.addresses.multicall),
        ]);
        this.setState({ pool: stakingPool, StakeInfo: multicallStakeInfo });
        window.EDITOR.forceUpdate();
        return stakingPool.ready;
    }

    public async validateForm(values: FormData): Promise<FormikErrors<FormData>> {
        this.setFormData(values);
        await new Promise((resolve) => this.resolveDebounced(resolve));
        const schemaWithTest = this.schema
            .test("max unstake amount", "potato too high", (value) => {
                console.log("hey from test");
                // TODO: check amount parseable to big
                const { amount } = value;
                const { StakeInfo } = this.state;
                console.log("amount:", amount);
                console.log("stake info:", StakeInfo.staked_balance);
                console.log(arx.big().max(StakeInfo.staked_balance).isValidSync(amount));
                return arx.big().max(StakeInfo.staked_balance).isValidSync(amount);
            })
            .test({
                name: "test",
                message: "test",
                test: (value) => {
                    console.log("test");
                    return true;
                },
            })
            .transform((value) => {
                console.log("transform");
                return value;
            });
        // run promises in parallel as staking pool info isn't needed for form validation
        await Promise.all([
            this.tryUpdateStakingPool(),
            // test can't stake more than balance
            schemaWithTest.check(values),
        ]);
        return Object.fromEntries(
            Object.entries(fields(this.schema))
                .map(([k, v]) => [k, v?.message() ?? ""])
                .filter(([_, v]) => v !== "")
        );
    }

    public override Editor = (): React.ReactNode => {
        const { resetForm, validateForm } = useFormikContext();
        const { pool, StakeInfo } = this.state;

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
                    label="Validator Address"
                    roundtop
                />
                {pool.ready ? (
                    <div>{`Staked balance: ${formatTokenAmount(StakeInfo.staked_balance, 24, 2)} Ⓝ`}</div>
                ) : null}
                <UnitField
                    name="amount"
                    unit="amountUnit"
                    options={["NEAR", "yocto"]}
                    label="Unstaking amount"
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
