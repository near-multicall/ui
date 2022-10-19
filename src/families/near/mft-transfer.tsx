import { InputAdornment } from "@mui/material";
import { Form, FormikErrors, useFormikContext } from "formik";
import { useEffect } from "react";
import { args as arx } from "../../shared/lib/args/args";
import { fields } from "../../shared/lib/args/args-types/args-object";
import { Call, CallError } from "../../shared/lib/call";
import { toGas } from "../../shared/lib/converter";
import { MultiFungibleToken } from "../../shared/lib/standards/multiFungibleToken";
import { TextField, UnitField } from "../../shared/ui/form-fields";
import type { DefaultFormData } from "../base";
import { BaseTask, BaseTaskProps, BaseTaskState } from "../base";
import "./near.scss";

type FormData = DefaultFormData & {
    tokenId: string;
    receiverId: string;
    amount: string;
    memo: string;
};

type Props = BaseTaskProps;

type State = BaseTaskState<FormData> & {
    token: MultiFungibleToken;
};

export class MftTransfer extends BaseTask<FormData, Props, State> {
    override uniqueClassName = "near-mft-transfer-task";
    override schema = arx
        .object()
        .shape({
            addr: arx.string().contract(),
            gas: arx.big().gas().min(toGas("1")).max(toGas("250")),
            tokenId: arx.string().mft("addr"),
            receiverId: arx.string().address(),
            amount: arx.big().token().min(1, "cannot transfer 0 token"),
            memo: arx.string().optional(),
        })
        .transform(({ gas, gasUnit, ...rest }) => ({
            ...rest,
            gas: arx.big().intoParsed(gasUnit).cast(gas),
        }))
        .requireAll({ ignore: ["memo"] })
        .retainAll();

    override initialValues: FormData = {
        name: "MFT Transfer",
        addr: window.nearConfig.REF_EXCHANGE_ADDRESS,
        func: "mft_transfer",
        gas: "10",
        gasUnit: "Tgas",
        depo: "1",
        depoUnit: "yocto",
        tokenId: "",
        receiverId: "",
        amount: "0",
        memo: "",
    };

    constructor(props: Props) {
        super(props);
        this._constructor();

        this.state = {
            ...this.state,
            token: new MultiFungibleToken(this.state.formData.addr, this.state.formData.tokenId),
        };

        this.tryUpdateMft().catch(() => {});
    }

    protected override init(
        call: Call<{
            token_id: string;
            receiver_id: string;
            amount: string;
            memo: string;
        }> | null
    ): void {
        if (call !== null) {
            const fromCall = {
                addr: call.address,
                func: call.actions[0].func,
                gas: arx.big().intoFormatted(this.initialValues.gasUnit).cast(call.actions[0].gas).toFixed(),
                tokenId: call.actions[0].args.token_id,
                receiverId: call.actions[0].args.receiver_id,
                amount: call.actions[0].args.amount,
                memo: call.actions[0].args.memo,
            };
            this.initialValues = Object.keys(this.initialValues).reduce((acc, k) => {
                const v = fromCall[k as keyof typeof fromCall];
                return v !== null && v !== undefined ? { ...acc, [k as keyof FormData]: v } : acc;
            }, this.initialValues);
        }

        this.state = { ...this.state, formData: this.initialValues };
        this.schema.check(this.state.formData);

        if (call !== null)
            this.tryUpdateMft().then((res: boolean) =>
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

    static override inferOwnType(json: Call): boolean {
        return !!json && json.actions[0].func === "mft_transfer";
    }

    public override toCall(): Call {
        const { addr, func, depo, gas, gasUnit, tokenId, receiverId, amount, memo } = this.state.formData;
        const { token } = this.state;

        if (!arx.big().isValidSync(gas)) throw new CallError("Failed to parse gas input value", this.props.id);
        if (!arx.big().isValidSync(amount)) throw new CallError("Failed to parse amount input value", this.props.id);

        return {
            address: addr,
            actions: [
                {
                    func,
                    args: {
                        token_id: tokenId,
                        receiver_id: receiverId,
                        amount: arx.big().intoParsed(token.metadata.decimals).cast(amount).toFixed(),
                        memo,
                    },
                    gas: arx.big().intoParsed(gasUnit).cast(gas).toFixed(),
                    depo,
                },
            ],
        };
    }

    private tryUpdateMft(): Promise<boolean> {
        return new Promise<boolean>((resolve) => {
            this.schema.check(this.state.formData).then(() => {
                const { addr } = fields(this.schema);
                if (!addr.isBad()) {
                    this.confidentlyUpdateMft().then((ready) => resolve(ready));
                } else {
                    this.setState({
                        token: new MultiFungibleToken(this.state.formData.addr, this.state.formData.tokenId),
                    }); // will be invalid
                    resolve(false);
                }
            });
        });
    }

    private async confidentlyUpdateMft(): Promise<boolean> {
        const { addr, tokenId } = this.state.formData;
        const newToken = await MultiFungibleToken.init(addr, tokenId);
        this.setState({ token: newToken });
        window.EDITOR.forceUpdate();
        return newToken.ready;
    }

    public override async validateForm(values: FormData): Promise<FormikErrors<FormData>> {
        this.setFormData(values);
        await new Promise((resolve) => this.resolveDebounced(resolve));
        await this.tryUpdateMft();
        await this.schema
            .transform(({ amount, ...rest }) => ({
                ...rest,
                amount: this.state.token.ready
                    ? arx.big().intoParsed(this.state.token.metadata.decimals).cast(amount)?.toFixed() ?? null
                    : amount,
            }))
            .check(values);
        return Object.fromEntries(
            Object.entries(fields(this.schema))
                .map(([k, v]) => [k, v?.message() ?? ""])
                .filter(([_, v]) => v !== "")
        );
    }

    public override Editor = (): React.ReactNode => {
        const { resetForm, validateForm } = useFormikContext();

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
                    name="tokenId"
                    label="Token ID"
                />
                <TextField
                    name="receiverId"
                    label="Receiver Address"
                />
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
                    name="memo"
                    label="Memo"
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
