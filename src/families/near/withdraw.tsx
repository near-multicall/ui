// include "context" everytime we call check()

import { Form, FormikErrors, useFormikContext } from "formik";
import { useEffect } from "react";
import { args as arx } from "../../shared/lib/args/args";
import { fields } from "../../shared/lib/args/args-types/args-object";
import { Call, CallError } from "../../shared/lib/call";
import { toGas, unit, formatTokenAmount } from "../../shared/lib/converter";
import { StakingPool } from "../../shared/lib/contracts/staking-pool";
import { CheckboxField, InfoField, TextField, UnitField } from "../../shared/ui/form";
import { BaseTask, BaseTaskProps, BaseTaskState } from "../base";
import "./near.scss";
import { STORAGE } from "../../shared/lib/persistent";

import type { DefaultFormData } from "../base";
import type { HumanReadableAccount } from "../../shared/lib/contracts/staking-pool";

type FormData = DefaultFormData & {
    amount: string;
    amountUnit: number | unit;
    withdrawAll: boolean;
};

type Props = BaseTaskProps;

type State = BaseTaskState<FormData> & {
    pool: StakingPool;
    stakeInfo: HumanReadableAccount | null;
};

export class Withdraw extends BaseTask<FormData, Props, State> {
    override uniqueClassName = "near-withdraw-task";
    override schema = arx
        .object()
        .shape({
            addr: arx.string().stakingPool(),
            gas: arx.big().gas().min(toGas("3.5"), "minimum 3.5 Tgas").max(toGas("250"), "maximum 250 Tgas"),
            withdrawAll: arx.boolean(),
            amount: arx
                .big()
                .token()
                .min("1", "cannot withdraw 0 NEAR")
                .when("withdrawAll", {
                    is: true,
                    then: (s) => s.optional(),
                    otherwise: (s) => s.required(),
                })
                .test({
                    name: "dynamic max",
                    message: "withdrawable amount exceeded",
                    test: (value, ctx) =>
                        value == null ||
                        ctx.options.context?.withdrawable == null ||
                        value.lte(ctx.options.context.withdrawable),
                }),
        })
        .transform(({ gas, gasUnit, amount, amountUnit, withdrawAll, ...rest }) => ({
            ...rest,
            withdrawAll,
            gas: arx.big().intoParsed(gasUnit).cast(gas),
            amount: withdrawAll ? null : arx.big().intoParsed(amountUnit).cast(amount),
        }))
        .requireAll()
        .retainAll();

    override initialValues: FormData = {
        name: "Withdraw Stake",
        addr: "",
        func: "withdraw",
        gas: "30",
        gasUnit: "Tgas",
        depo: "1",
        depoUnit: "yocto",
        amount: "0",
        amountUnit: "NEAR",
        withdrawAll: false,
    };

    constructor(props: Props) {
        super(props);
        this._constructor();

        this.state = {
            ...this.state,
            pool: new StakingPool(this.initialValues.addr),
            stakeInfo: null,
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
        return !!json && json.actions[0].func === "withdraw";
    }

    public override toCall(): Call {
        const { addr, func, gas, gasUnit, depo, amount, amountUnit, withdrawAll } = this.state.formData;

        if (!arx.big().isValidSync(gas)) throw new CallError("Failed to parse gas input value", this.props.id);
        if (!arx.big().isValidSync(depo)) throw new CallError("Failed to parse deposit input value", this.props.id);

        return {
            address: addr,
            actions: [
                {
                    func: withdrawAll ? "withdraw_all" : "withdraw",
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
        this.setState({ pool: stakingPool, stakeInfo: multicallStakeInfo });
        return stakingPool.ready;
    }

    public async validateForm(values: FormData): Promise<FormikErrors<FormData>> {
        values.func = values.withdrawAll ? "withdraw_all" : "withdraw";
        this.setFormData(values);
        await new Promise((resolve) => this.resolveDebounced(resolve));
        await this.tryUpdateStakingPool();
        const withdrawable = !!this.state.stakeInfo
            ? StakingPool.getWithdrawableAmount(
                  this.state.stakeInfo.unstaked_balance,
                  this.state.stakeInfo.can_withdraw
              )
            : null;
        // test can't stake more than balance
        await this.schema.check(values, { context: { withdrawable } });
        return Object.fromEntries(
            Object.entries(fields(this.schema))
                .map(([k, v]) => [k, v?.message() ?? ""])
                .filter(([_, v]) => v !== "")
        );
    }

    public override Editor = (): React.ReactNode => {
        const { resetForm, validateForm, values } = useFormikContext<FormData>();
        const { pool, stakeInfo } = this.state;
        const withdrawable = !!stakeInfo
            ? StakingPool.getWithdrawableAmount(stakeInfo.unstaked_balance, stakeInfo.can_withdraw)
            : null;

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
                {pool.ready && withdrawable ? (
                    <InfoField>{`Available to withdraw: ${formatTokenAmount(withdrawable, 24, 2)} Ⓝ`}</InfoField>
                ) : null}
                <CheckboxField
                    name="withdrawAll"
                    label="Unstake all available funds"
                    checked={values.withdrawAll}
                />
                {!values.withdrawAll && (
                    <UnitField
                        name="amount"
                        unit="amountUnit"
                        options={["NEAR", "yocto"]}
                        label="Unstaking amount"
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
