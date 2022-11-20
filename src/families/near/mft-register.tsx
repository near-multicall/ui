// TODO: integrate inside mft-transfer. similar to (ft-transfer + storage deposit)
import { Form, FormikErrors, useFormikContext } from "formik";
import { useEffect } from "react";
import { args as arx } from "../../shared/lib/args/args";
import { fields } from "../../shared/lib/args/args-types/args-object";
import { Call, CallError } from "../../shared/lib/call";
import { STORAGE } from "../../shared/lib/persistent";
import { MultiFungibleToken } from "../../shared/lib/standards/multiFungibleToken";
import { TextField, UnitField } from "../../shared/ui/form-fields";
import { BaseTask, BaseTaskProps, BaseTaskState, DefaultFormData } from "./../base";
import "./near.scss";

type FormData = DefaultFormData & {
    tokenId: string;
    accountId: string;
};

type Props = BaseTaskProps;

type State = BaseTaskState<FormData> & {
    token: MultiFungibleToken;
};

export class MftRegister extends BaseTask<FormData, Props, State> {
    override uniqueClassName = "near-mft-register-task";
    override schema = arx
        .object()
        .shape({
            addr: arx.string().contract(),
            tokenId: arx.string().mftId("addr"),
            gas: arx.big().gas(),
            depo: arx.big().token(),
            accountId: arx
                .string()
                .address()
                .test({
                    name: "account not registered",
                    message: "this account is registered already",
                    test: async (value, ctx) => {
                        if (value == null || ctx.options.context?.token == null) {
                            return true;
                        } else {
                            console.log(ctx.options.context?.token);
                            const hasRegistered = await ctx.options.context?.token.mftHasRegistered(value);
                            return hasRegistered;
                        }
                    },
                }),
        })
        .transform(({ gas, gasUnit, depo, depoUnit, ...rest }) => ({
            ...rest,
            gas: arx.big().intoParsed(gasUnit).cast(gas).toFixed(),
            depo: arx.big().intoParsed(depoUnit).cast(depo).toFixed(),
        }))
        .requireAll()
        .retainAll();

    override initialValues: FormData = {
        name: "MFT register",
        addr: window.nearConfig.REF_EXCHANGE_ADDRESS,
        tokenId: "",
        func: "mft_register",
        gas: "7.5",
        gasUnit: "Tgas",
        depo: "0.1",
        depoUnit: "NEAR",
        accountId: STORAGE.addresses.multicall,
    };

    constructor(props: BaseTaskProps) {
        super(props);
        this._constructor();

        this.state = {
            ...this.state,
            token: new MultiFungibleToken(this.state.formData.addr, this.state.formData.tokenId),
        };
    }

    protected override init(
        call: Call<{
            token_id: string;
            account_id: string;
        }> | null
    ): void {
        if (call !== null) {
            const fromCall = {
                addr: call.address,
                func: call.actions[0].func,
                gas: arx.big().intoFormatted(this.initialValues.gasUnit).cast(call.actions[0].gas).toFixed(),
                depo: arx.big().intoFormatted(this.initialValues.depoUnit).cast(call.actions[0].depo).toFixed(),
                tokenId: call.actions[0].args?.token_id ?? "",
                accountId: call.actions[0].args?.account_id ?? STORAGE.addresses.multicall,
            };

            this.initialValues = Object.keys(this.initialValues).reduce((acc, k) => {
                const v = fromCall[k as keyof typeof fromCall];
                return v !== null && v !== undefined ? { ...acc, [k as keyof FormData]: v } : acc;
            }, this.initialValues);
        }

        this.state = { ...this.state, formData: this.initialValues };
        this.schema.check(this.state.formData, {
            context: {
                token: this.state.token,
            },
        });

        this.tryUpdateMft().catch(() => {});
    }

    static override inferOwnType(json: Call): boolean {
        return !!json && json.actions.length === 1 && json.actions[0].func === "mft_register";
    }

    public override toCall(): Call {
        const { addr, func, gas, gasUnit, depo, depoUnit, accountId, tokenId } = this.state.formData;

        if (!arx.big().isValidSync(gas)) throw new CallError("Failed to parse gas input value", this.props.id);
        if (!arx.big().isValidSync(depo)) throw new CallError("Failed to parse deposit input value", this.props.id);

        return {
            address: addr,
            actions: [
                {
                    func,
                    args: {
                        token_id: tokenId,
                        account_id: accountId,
                    },
                    gas: arx.big().intoParsed(gasUnit).cast(gas).toFixed(),
                    depo: arx.big().intoParsed(depoUnit).cast(depo).toFixed(),
                },
            ],
        };
    }

    private tryUpdateMft(): Promise<boolean> {
        return new Promise<boolean>((resolve) => {
            this.schema
                .check(this.state.formData, {
                    context: {
                        token: this.state.token,
                    },
                })
                .then(() => {
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
        await this.schema.check(values, {
            context: {
                token: this.state.token,
            },
        });
        return Object.fromEntries(
            Object.entries(fields(this.schema))
                .map(([k, v]) => [k, v?.message() ?? ""])
                .filter(([_, v]) => v !== "")
        );
    }

    public override Editor = (): React.ReactNode => {
        const { resetForm, validateForm, values } = useFormikContext<FormData>();
        const { token } = this.state;

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
                    name="accountId"
                    label="Account ID"
                />
                <UnitField
                    name="depo"
                    label="Amount"
                    unit="depoUnit"
                    options={["NEAR", "yocto"]}
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
