import { Form, useFormikContext } from "formik";
import { useEffect } from "react";
import { string } from "yup";
import { args as arx } from "../../shared/lib/args/args";
import { Call, CallError } from "../../shared/lib/call";
import { Multicall } from "../../shared/lib/contracts/multicall";
import { MintbaseStore } from "../../shared/lib/contracts/mintbase";
import { unit } from "../../shared/lib/converter";
import { STORAGE } from "../../shared/lib/persistent";
import { CheckboxField, TextField, UnitField } from "../../shared/ui/form-fields";
import { BaseTask, BaseTaskProps, DefaultFormData } from "../base";
import "./multicall.scss";

type FormData = DefaultFormData & {
    owner: string;
    name: string;
    symbol: string;
    icon: string;
};

export class CreateStore extends BaseTask<FormData> {
    override uniqueClassName = "mintbase-create-store-task";
    override schema = arx
        .object()
        .shape({
            owner: arx.string().address(),
            name: arx.string().lowercase("must be all lowercase"),
            symbol: arx.string().max(4, "maximum is 4 letters").lowercase("must be all lowercase"),
            icon: arx.string(),
            amount: arx.big().token(),
        })
        .transform(({ gas, gasUnit, amount, amountUnit, transferAll, ...rest }) => ({
            ...rest,
            gas: arx.big().intoParsed(gasUnit).cast(gas),
            amount: arx.big().intoParsed(amountUnit).cast(amount),
        }))
        .requireAll()
        .retainAll();

    override initialValues: FormData = {
        name: "Create Store",
        addr: MintbaseStore.FACTORY_ADDRESS,
        func: "create_store",
        // TODO: try smaller values. See: https://explorer.mainnet.near.org/transactions/A1s4QPiP95bBe4bcgFHA5VooADdUoSEPCnVK5PByNpMm
        gas: "200",
        gasUnit: "Tgas",
        depo: "6.5",
        depoUnit: "NEAR",
        owner: "",
        name: "",
        symbol: "",
        icon: "",
        amount: "0",
        amountUnit: "NEAR",
        transferAll: false,
    };

    constructor(props: BaseTaskProps) {
        super(props);
        this._constructor();
    }

    protected override init(
        call: Call<{
            account_id: string;
            amount: string;
        }> | null
    ): void {
        if (call !== null) {
            const fromCall = {
                addr: call.address,
                func: call.actions[0].func,
                gas: arx.big().intoFormatted(this.initialValues.gasUnit).cast(call.actions[0].gas).toFixed(),
                accountId: call.actions[0].args.account_id,
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
        return (
            !!json &&
            arx.string().address().isValidSync(json.address) &&
            json.address.endsWith(Multicall.FACTORY_ADDRESS) &&
            json.actions[0].func === "near_transfer"
        );
    }

    public override toCall(): Call {
        const { addr, func, gas, gasUnit, depo, depoUnit, accountId, amount, amountUnit, transferAll } =
            this.state.formData;

        if (!arx.big().isValidSync(gas)) throw new CallError("Failed to parse gas input value", this.props.id);
        if (!arx.big().isValidSync(amount)) throw new CallError("Failed to parse amount input value", this.props.id);

        return {
            address: addr,
            actions: [
                {
                    func,
                    args: transferAll
                        ? {
                              account_id: accountId,
                          }
                        : {
                              account_id: accountId,
                              amount: arx.big().intoParsed(amountUnit).cast(amount).toFixed(),
                          },
                    gas: arx.big().intoParsed(gasUnit).cast(gas).toFixed(),
                    depo: arx.big().intoParsed(depoUnit).cast(depo).toFixed(),
                },
            ],
        };
    }

    protected override onAddressesUpdated(e: CustomEvent<{ multicall: string }>): void {
        this.setFormData({ addr: e.detail.multicall });
        window.EDITOR.forceUpdate();
        this.forceUpdate();
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
                    name="accountId"
                    label="Receiver Address"
                    roundtop
                />
                <CheckboxField
                    name="transferAll"
                    label="Transfer all available funds"
                    checked={values.transferAll}
                />
                {!values.transferAll && (
                    <UnitField
                        name="amount"
                        unit="amountUnit"
                        options={["NEAR", "yocto"]}
                        label="Transfer amount"
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
