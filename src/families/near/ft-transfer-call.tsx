import { InputAdornment } from "@mui/material";
import { Form, FormikErrors, useFormikContext } from "formik";
import { useEffect } from "react";
import { args as arx } from "../../shared/lib/args/args";
import { fields } from "../../shared/lib/args/args-types/args-object";
import { Call, CallError } from "../../shared/lib/call";
import { Big, toGas, unit } from "../../shared/lib/converter";
import { FungibleToken } from "../../shared/lib/standards/fungibleToken";
import { TextField, UnitField, InfoField, CheckboxField } from "../../shared/ui/form-fields";
import { BaseTask, BaseTaskProps, BaseTaskState, DefaultFormData, DisplayData } from "../base";
import "./near.scss";

type FormData = DefaultFormData & {
    receiverId: string;
    amount: string;
    memo: string | null;
    msg: string;
    payStorageDeposit: boolean;
    sdGas: string;
    sdGasUnit: number | unit;
};

type Props = BaseTaskProps;

type State = BaseTaskState<FormData> & {
    token: FungibleToken;
    needsSd: boolean;
};

export class FtTransferCall extends BaseTask<FormData, Props, State> {
    override uniqueClassName = "near-ft-transfer-call-task";
    override schema = arx
        .object()
        .shape({
            addr: arx.string().contract(),
            gas: arx.big().gas().min(toGas("30"), "minimum 30 Tgas").max(toGas("250")),
            receiverId: arx.string().address(),
            amount: arx.big().token().min(0, "amount must be at least ${min}"),
            memo: arx.string().optional(),
            msg: arx.string().optional(),
            payStorageDeposit: arx.boolean(),
            sdGas: arx
                .big()
                .gas()
                .requiredWhen("payStorageDeposit", (payStorageDeposit) => payStorageDeposit),
        })
        .transform(({ gas, gasUnit, sdGas, sdGasUnit, ...rest }) => ({
            ...rest,
            gas: arx.big().intoParsed(gasUnit).cast(gas),
            sdGas: arx.big().intoParsed(sdGasUnit).cast(sdGas).toFixed(),
        }))
        .requireAll({ ignore: ["memo", "msg"] })
        .retainAll();

    override initialValues: FormData = {
        name: "FT Transfer Call",
        addr: window.nearConfig.WNEAR_ADDRESS,
        func: "ft_transfer_call",
        gas: "150",
        gasUnit: "Tgas",
        depo: "1",
        depoUnit: "yocto",
        receiverId: "",
        amount: "0",
        memo: "",
        msg: "",
        payStorageDeposit: false,
        sdGas: "7.5",
        sdGasUnit: "Tgas",
    };

    constructor(props: Props) {
        super(props);
        this._constructor();
        this.state = {
            ...this.state,
            token: new FungibleToken(this.initialValues.addr),
            needsSd: false,
        };
    }

    protected override init(call: Call<any> | null): void {
        if (call !== null) {
            const hasSd =
                call.actions.length === 2 &&
                call.actions[0].func === "storage_deposit" &&
                call.actions[1].func === "ft_transfer";
            const fromCall = {
                addr: call.address,
                func: call.actions[hasSd ? 1 : 0].func,
                gas: arx
                    .big()
                    .intoFormatted(this.initialValues.gasUnit)
                    .cast(call.actions[hasSd ? 1 : 0].gas)
                    .toFixed(),
                receiverId: call.actions[hasSd ? 1 : 0].args.receiver_id,
                amount: call.actions[hasSd ? 1 : 0].args.amount,
                memo: call.actions[hasSd ? 1 : 0].args.memo,
                msg: call.actions[hasSd ? 1 : 0].args.msg,
                payStorageDeposit: hasSd,
                ...(hasSd && { sdGas: call.actions[0].args.gas }),
            };

            this.initialValues = Object.keys(this.initialValues).reduce((acc, k) => {
                const v = fromCall[k as keyof typeof fromCall];
                return v !== null && v !== undefined ? { ...acc, [k as keyof FormData]: v } : acc;
            }, this.initialValues);
        }

        this.state = { ...this.state, formData: this.initialValues };
        this.schema.check(this.state.formData);

        if (call !== null)
            this.tryUpdateFt().then((res: boolean) =>
                this.setFormData({
                    amount: res
                        ? arx
                              .big()
                              .intoFormatted(this.state.token.metadata.decimals)
                              .cast(this.state.formData.amount)
                              .toFixed()
                        : this.state.formData.amount,
                })
            );
    }

    static override inferOwnType(json: Call<any>): boolean {
        return (
            !!json &&
            ((json.actions.length === 1 && json.actions[0].func === "ft_transfer_call") ||
                (json.actions.length === 2 &&
                    json.actions[0].func === "storage_deposit" &&
                    json.actions[1].func === "ft_transfer_call" &&
                    json.actions[0].args.account_id === json.actions[1].args.receiver_id &&
                    json.actions[0].args.registration_only === true))
        );
    }

    public override toCall(): Call {
        const { addr, func, receiverId, memo, msg, amount, gas, gasUnit, depo, payStorageDeposit, sdGas, sdGasUnit } =
            this.state.formData;
        const { token } = this.state;

        if (!arx.big().isValidSync(gas)) throw new CallError("Failed to parse gas input value", this.props.id);
        if (!arx.big().isValidSync(amount)) throw new CallError("Failed to parse amount input value", this.props.id);
        if (!arx.big().isValidSync(sdGas)) throw new CallError("Failed to parse amount input value", this.props.id);
        if (!token.ready) throw new CallError("Lacking token metadata", this.props.id);

        return {
            address: addr,
            actions: [
                ...(payStorageDeposit
                    ? [
                          {
                              func: "storage_deposit",
                              args: {
                                  account_id: receiverId,
                                  registration_only: true,
                              },
                              gas: arx.big().intoParsed(sdGasUnit).cast(sdGas).toFixed(),
                              depo: token.storageBounds.min,
                          },
                      ]
                    : []),
                {
                    func,
                    args: {
                        receiver_id: receiverId,
                        amount: arx.big().intoParsed(token.metadata.decimals).cast(amount).toFixed(),
                        memo,
                        msg,
                    },
                    gas: arx.big().intoParsed(gasUnit).cast(gas).toFixed(),
                    depo,
                },
            ],
        };
    }

    private tryUpdateFt(): Promise<boolean> {
        return new Promise<boolean>((resolve) => {
            this.schema.check(this.state.formData).then(() => {
                const { addr } = fields(this.schema);
                if (!addr.isBad()) {
                    this.confidentlyUpdateFt().then((ready) => resolve(ready));
                } else {
                    this.setState({ token: new FungibleToken(this.state.formData.addr) }); // will be invalid
                    resolve(false);
                }
            });
        });
    }

    private async confidentlyUpdateFt(): Promise<boolean> {
        const { addr, receiverId } = this.state.formData;
        const newToken = await FungibleToken.init(addr);
        const storageBalance = !fields(this.schema).receiverId.isBad()
            ? await newToken.storageBalanceOf(receiverId)
            : null;
        this.setState({
            token: newToken,
            needsSd: !!storageBalance && Big(storageBalance.total).lt(newToken.storageBounds.min),
        });
        window.EDITOR.forceUpdate();
        return newToken.ready;
    }

    public override async validateForm(values: FormData): Promise<FormikErrors<FormData>> {
        this.setFormData(values);
        await new Promise((resolve) => this.resolveDebounced(resolve));
        await this.tryUpdateFt();
        await this.schema.check(
            (({ amount, ...rest }) => ({
                ...rest,
                amount: this.state.token.ready
                    ? arx.big().intoParsed(this.state.token.metadata.decimals).cast(amount)?.toFixed() ?? null
                    : amount,
            }))(values)
        );
        return Object.fromEntries(
            Object.entries(fields(this.schema))
                .map(([k, v]) => [k, v?.message() ?? ""])
                .filter(([_, v]) => v !== "")
        );
    }

    public override Editor = (): React.ReactNode => {
        const { resetForm, validateForm, values, setFieldValue } = useFormikContext<FormData>();
        const sdAmount = arx.big().intoFormatted("NEAR").cast(this.state.token.storageBounds.min).toFixed();

        useEffect(() => {
            resetForm({
                values: this.state.formData,
                touched: Object.keys(this.state.formData).reduce((acc, k) => ({ ...acc, [k]: true }), {}),
            });
            validateForm(this.state.formData);
        }, []);

        useEffect(() => {
            if (values.addr !== this.initialValues.addr || values.receiverId !== this.initialValues.receiverId)
                this.tryUpdateFt().then(() => setFieldValue("payStorageDeposit", this.state.needsSd));
        }, [values.addr, values.receiverId]);

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
                    name="receiverId"
                    label="Receiver Address"
                />
                <InfoField>
                    {this.state.needsSd && (
                        <b className="warn">{`${values.receiverId} is missing a storage deposit to receive this token!`}</b>
                    )}
                    <CheckboxField
                        name="payStorageDeposit"
                        label={"Pay Storage Deposit" + (!!sdAmount && ` (${sdAmount} Ⓝ)`)}
                        checked={values.payStorageDeposit}
                    />
                    {!!values.payStorageDeposit && (
                        <UnitField
                            name="sdGas"
                            label="Gas for Storage Deposit"
                            unit="sdGasUnit"
                            options={["Tgas", "gas"]}
                        />
                    )}
                </InfoField>
                <TextField
                    name="amount"
                    label="Amount"
                    InputProps={{
                        endAdornment: (
                            <InputAdornment position="end">{this.state.token.metadata.symbol}</InputAdornment>
                        ),
                    }}
                />
                <TextField
                    name="msg"
                    label="Message"
                    multiline
                />
                <TextField
                    name="memo"
                    label="Memo"
                    multiline
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

    protected override getDisplayData(): DisplayData {
        const { name, addr, func, gas, gasUnit, depo, depoUnit, sdGas, sdGasUnit, payStorageDeposit } =
            this.state.formData;
        let args = [""];
        try {
            args[0] = JSON.stringify(this.toCall().actions[0].args, null, " ");
        } catch (e) {
            if (e instanceof CallError) args[0] = `Error: ${e.message}`;
        }
        if (payStorageDeposit)
            try {
                args[1] = JSON.stringify(this.toCall().actions[1].args, null, " ");
            } catch (e) {
                if (e instanceof CallError) args[1] = `Error: ${e.message}`;
            }

        return {
            name,
            addr,
            actions: {
                ...(payStorageDeposit && {
                    "action-1": {
                        func: "storage_deposit",
                        gas: sdGas.toString(),
                        gasUnit: sdGasUnit.toString(),
                        depo: arx.big().intoFormatted("NEAR").cast(this.state.token.storageBounds.min).toFixed(),
                        depoUnit: "NEAR",
                        args: args[0],
                    },
                }),
                "action-0": {
                    func,
                    gas,
                    gasUnit: gasUnit.toString(),
                    depo,
                    depoUnit: depoUnit.toString(),
                    args: payStorageDeposit ? args[1] : args[0],
                },
            },
        };
    }
}
