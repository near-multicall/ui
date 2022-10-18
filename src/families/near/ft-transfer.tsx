import { InputAdornment } from "@mui/material";
import { Form, useFormikContext } from "formik";
import { useEffect } from "react";
import { args as arx } from "../../shared/lib/args/args";
import { fields } from "../../shared/lib/args/args-types/args-object";
import { Call, CallError } from "../../shared/lib/call";
import { toGas } from "../../shared/lib/converter";
import { FungibleToken } from "../../shared/lib/standards/fungibleToken";
import { TextField, UnitField } from "../../shared/ui/form-fields";
import type { DefaultFormData } from "../base";
import { BaseTask, BaseTaskProps, BaseTaskState } from "../base";
import "./near.scss";

type FormData = DefaultFormData & {
    receiverId: string;
    amount: string;
    memo: string;
};

type Props = BaseTaskProps;

type State = BaseTaskState<FormData> & {
    token: FungibleToken;
};

export class FtTransfer extends BaseTask<FormData, Props, State> {
    override uniqueClassName = "near-ft-transfer-task";
    override schema = arx
        .object()
        .shape({
            addr: arx.string().ft(),
            gas: arx.big().gas().min(toGas("1")).max(toGas("250")),
            receiverId: arx.string().address(),
            amount: arx.big().token().min(0, "amount must be at least ${min}"),
            memo: arx.string().optional(),
        })
        .transform(({ gas, gasUnit, ...rest }) => ({
            ...rest,
            gas: arx.big().intoParsed(gasUnit).cast(gas),
        }))
        .requireAll({ ignore: ["memo"] })
        .retainAll();

    override initialValues: FormData = {
        name: "FT Transfer",
        addr: window.nearConfig.WNEAR_ADDRESS,
        func: "ft_transfer",
        gas: "10",
        gasUnit: "Tgas",
        depo: "1",
        depoUnit: "yocto",
        receiverId: "",
        amount: "0",
        memo: "",
    };

    constructor(props: Props) {
        super(props);
        this._constructor();

        this.state = {
            ...this.state,
            token: new FungibleToken(this.initialValues.addr),
        };

        this.tryUpdateFt().catch(() => {});
    }

    protected override init(
        call: Call<{
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
    }

    static override inferOwnType(json: Call): boolean {
        return !!json && arx.string().address().isValidSync(json.address) && json.actions[0].func === "ft_transfer";
    }

    public override toCall(): Call {
        const { addr, gas, gasUnit, receiverId, amount, memo } = this.state.formData;
        const { token } = this.state;

        if (!arx.big().isValidSync(gas)) throw new CallError("Failed to parse gas input value", this.props.id);
        if (!arx.big().isValidSync(amount)) throw new CallError("Failed to parse amount input value", this.props.id);

        return {
            address: addr,
            actions: [
                {
                    func: "ft_transfer",
                    args: {
                        receiver_id: receiverId,
                        amount: arx.big().intoParsed(token.metadata.decimals).cast(amount).toFixed(),
                        memo,
                    },
                    gas: arx.big().intoParsed(gasUnit).cast(gas).toFixed(),
                    depo: "1",
                },
            ],
        };
    }

    private tryUpdateFt(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.schema.check(this.state.formData).then(() => {
                const { addr } = fields(this.schema);
                if (!addr.isBad()) {
                    this.confidentlyUpdateFt().then((ready) => (ready ? resolve() : reject()));
                } else {
                    this.setState({ token: new FungibleToken(this.state.formData.addr) }); // will be invalid
                    reject();
                }
            });
        });
    }

    private async confidentlyUpdateFt(): Promise<boolean> {
        const { addr } = this.state.formData;
        const newToken = await FungibleToken.init(addr);
        this.setState({ token: newToken });
        window.EDITOR.forceUpdate();
        return newToken.ready;
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
