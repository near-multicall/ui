// TODO: add checkbox and support "unstake_all".

import { Form, FormikErrors, useFormikContext } from "formik";
import { useEffect } from "react";
import { args as arx } from "../../shared/lib/args/args";
import { fields } from "../../shared/lib/args/args-types/args-object";
import { Call, CallError } from "../../shared/lib/call";
import { toGas, unit, formatTokenAmount } from "../../shared/lib/converter";
import { MintbaseStore } from "../../shared/lib/contracts/mintbase";
import { CheckboxField, TextField, UnitField } from "../../shared/ui/form-fields";
import { BaseTask, BaseTaskProps, BaseTaskState } from "../base";
import "./near.scss";
import { STORAGE } from "../../shared/lib/persistent";

import type { DefaultFormData } from "../base";
import { InfoField } from "../../shared/ui/form-fields/info-field/info-field";

type FormData = DefaultFormData & {
    accountId: string;
};

type Props = BaseTaskProps;

type State = BaseTaskState<FormData> & {
    mintbaseStore: MintbaseStore;
};

export class Unstake extends BaseTask<FormData, Props, State> {
    override uniqueClassName = "near-unstake-task";
    override schema = arx
        .object()
        .shape({
            addr: arx.string().stakingPool(),
            gas: arx.big().gas().min(toGas("3.5")).max(toGas("250")),
            accountId: arx.string().address(),
        })
        .transform(({ gas, gasUnit, ...rest }) => ({
            ...rest,
            gas: arx.big().intoParsed(gasUnit).cast(gas),
        }))
        .requireAll()
        .retainAll();

    override initialValues: FormData = {
        name: "Transfer store ownership",
        addr: "",
        func: "transfer_store_ownership",
        accountId: "",
        gas: "30",
        gasUnit: "Tgas",
        depo: "1",
        depoUnit: "yocto",
    };

    constructor(props: Props) {
        super(props);
        this._constructor();

        this.state = {
            ...this.state,
            currentOwner: "",
        };

        // TODO: get store owner/ store data
        this.tryUpdateStakingPool().catch(() => {});
    }

    protected override init(
        call: Call<{
            account_id: string;
        }> | null
    ): void {
        if (call !== null) {
            const fromCall = {
                addr: call.address,
                func: call.actions[0].func,
                accountId: call.actions[0].args.account_id,
                gas: arx.big().intoFormatted(this.initialValues.gasUnit).cast(call.actions[0].gas).toFixed(),
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
        return !!json && json.actions[0].func === "transfer_store_ownership";
    }

    public override toCall(): Call {
        const { addr, accountId, gas, gasUnit, depo } = this.state.formData;

        if (!arx.big().isValidSync(gas)) throw new CallError("Failed to parse gas input value", this.props.id);
        if (!arx.big().isValidSync(depo)) throw new CallError("Failed to parse deposit input value", this.props.id);

        return {
            address: addr,
            actions: [
                {
                    func: "transfer_store_ownership",
                    args: { account_id: accountId },
                    gas: arx.big().intoParsed(gasUnit).cast(gas).toFixed(),
                    depo,
                },
            ],
        };
    }

    // TODO: fetch store owner/data
    private tryUpdateStakingPool(): Promise<boolean> {
        return new Promise<boolean>((resolve) => {
            this.schema.check(this.state.formData).then(() => {
                const { addr } = fields(this.schema);
                if (!addr.isBad()) {
                    this.confidentlyUpdateStakingPool().then((ready) => resolve(ready));
                } else {
                    this.setState({ mintbaseStore: new MintbaseStore(this.state.formData.addr) }); // will be invalid
                    resolve(false);
                }
            });
        });
    }

    // fetch store data/owner
    private async confidentlyUpdateStakingPool(): Promise<boolean> {
        const { addr } = this.state.formData;
        const [store, multicallStakeInfo] = await Promise.all([
            MintbaseStore.init(addr),
            new StakingPool(addr).getAccount(STORAGE.addresses.multicall),
        ]);
        this.setState({ mintbaseStore: store, stakeInfo: multicallStakeInfo });
        window.EDITOR.forceUpdate();
        return store.ready;
    }

    public async validateForm(values: FormData): Promise<FormikErrors<FormData>> {
        values.func = values.unstakeAll ? "unstake_all" : "unstake";
        this.setFormData(values);
        await new Promise((resolve) => this.resolveDebounced(resolve));
        await this.tryUpdateStakingPool();
        // test can't stake more than balance
        await this.schema.check(values, { context: { stakedAmount: this.state.stakeInfo?.staked_balance } });
        return Object.fromEntries(
            Object.entries(fields(this.schema))
                .map(([k, v]) => [k, v?.message() ?? ""])
                .filter(([_, v]) => v !== "")
        );
    }

    public override Editor = (): React.ReactNode => {
        const { resetForm, validateForm, values } = useFormikContext<FormData>();
        const { mintbaseStore } = this.state;

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
                    label="Store address"
                    roundtop
                />
                {pool.ready ? (
                    <InfoField>{`Staked balance: ${formatTokenAmount(stakeInfo!.staked_balance, 24, 2)} Ⓝ`}</InfoField>
                ) : null}
                <CheckboxField
                    name="unstakeAll"
                    label="Unstake all available funds"
                    checked={values.unstakeAll}
                />
                {!values.unstakeAll && (
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
