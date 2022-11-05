import { Form, FormikErrors, useFormikContext } from "formik";
import { useEffect } from "react";
import { args as arx } from "../../shared/lib/args/args";
import { fields } from "../../shared/lib/args/args-types/args-object";
import { Call, CallError } from "../../shared/lib/call";
import { toGas } from "../../shared/lib/converter";
import { STORAGE } from "../../shared/lib/persistent";
import { NonFungibleToken } from "../../shared/lib/standards/nonFungibleToken";
import { CheckboxField, TextField, UnitField } from "../../shared/ui/form-fields";
import type { DefaultFormData } from "../base";
import { BaseTask, BaseTaskProps, BaseTaskState } from "../base";
import "./near.scss";

type FormData = DefaultFormData & {
    tokenId: string;
    accountId: string;
    addMsg: boolean;
    msg: string;
};

type Props = BaseTaskProps;

type State = BaseTaskState<FormData> & {
    nft: NonFungibleToken;
};

export class NftApprove extends BaseTask<FormData, Props, State> {
    override uniqueClassName = "near-nft-approve-task";
    override schema = arx
        .object()
        .shape({
            addr: arx.string().nft(),
            gas: arx.big().gas().min(toGas("1")).max(toGas("250")),
            depo: arx.big().token().min(1),
            tokenId: arx
                .string()
                .nftId("addr")
                .test({
                    name: "approval",
                    message: "multicall does not have permission to approve this NFT",
                    test: (value, ctx) =>
                        value == null ||
                        ctx.options.context?.token == null ||
                        ctx.options.context?.multicallAddress == null ||
                        ctx.options.context.token.owner_id === ctx.options.context.multicallAddress ||
                        Object.keys(ctx.options.context.token.approved_account_ids).includes(
                            ctx.options.context.multicallAddress
                        ),
                }),
            accountId: arx.string().address(),
            msg: arx.string().optional(),
        })
        .transform(({ gas, gasUnit, depo, depoUnit, addMsg, msg, ...rest }) => ({
            ...rest,
            gas: arx.big().intoParsed(gasUnit).cast(gas),
            depo: arx.big().intoParsed(depoUnit).cast(depo),
            ...(addMsg && { msg }),
        }))
        .requireAll({ ignore: ["msg"] })
        .retainAll();

    override initialValues: FormData = {
        name: "NFT Approve",
        addr: "",
        func: "nft_approve",
        gas: "0",
        gasUnit: "Tgas",
        depo: "1",
        depoUnit: "yocto",
        tokenId: "",
        accountId: "",
        addMsg: false,
        msg: "",
    };

    constructor(props: Props) {
        super(props);
        this._constructor();

        this.state = {
            ...this.state,
            nft: new NonFungibleToken(this.state.formData.addr),
        };
    }

    protected override init(
        call: Call<{
            token_id: string;
            account_id: string;
            msg: string;
        }> | null
    ): void {
        if (call !== null) {
            const fromCall = {
                addr: call.address,
                func: call.actions[0].func,
                gas: arx.big().intoFormatted(this.initialValues.gasUnit).cast(call.actions[0].gas).toFixed(),
                depo: arx.big().intoFormatted(this.initialValues.depoUnit).cast(call.actions[0].depo).toFixed(),
                accountId: call.actions[0].args.account_id,
                tokenId: call.actions[0].args.token_id,
                addMsg: call.actions[0].args.msg === undefined,
                msg: call.actions[0].args?.msg ?? null,
            };
            this.initialValues = Object.keys(this.initialValues).reduce((acc, k) => {
                const v = fromCall[k as keyof typeof fromCall];
                return v !== null && v !== undefined ? { ...acc, [k as keyof FormData]: v } : acc;
            }, this.initialValues);
        }

        this.state = { ...this.state, formData: this.initialValues };
        this.schema.check(this.state.formData, {
            context: {
                token: this.state.nft?.token,
                multicallAddress: STORAGE.addresses.multicall,
            },
        });

        if (call !== null) this.tryUpdateNft();
    }

    static override inferOwnType(json: Call): boolean {
        return !!json && json.actions[0].func === "nft_approve";
    }

    public override toCall(): Call {
        const { addr, func, depo, gas, gasUnit, tokenId, accountId, msg, addMsg } = this.state.formData;
        const { nft } = this.state;

        if (!arx.big().isValidSync(gas)) throw new CallError("Failed to parse gas input value", this.props.id);
        if (!arx.big().isValidSync(depo)) throw new CallError("Failed to parse deposit input value", this.props.id);
        if (!nft.ready || !nft.token) throw new CallError("Lacking token metadata", this.props.id);

        const miIsOwner = nft.token.owner_id === STORAGE.addresses.multicall;
        const approvalId = nft.token.approved_account_ids[STORAGE.addresses.multicall];

        return {
            address: addr,
            actions: [
                {
                    func,
                    args: {
                        token_id: tokenId,
                        account_id: accountId,
                        ...(miIsOwner && { approval_id: approvalId }),
                        ...(addMsg && { msg }),
                    },
                    gas: arx.big().intoParsed(gasUnit).cast(gas).toFixed(),
                    depo,
                },
            ],
        };
    }

    private tryUpdateNft(): Promise<boolean> {
        return new Promise<boolean>((resolve) => {
            this.schema
                .check(this.state.formData, {
                    context: {
                        token: this.state.nft?.token,
                        multicallAddress: STORAGE.addresses.multicall,
                    },
                })
                .then(() => {
                    const { addr } = fields(this.schema);
                    if (!addr.isBad()) {
                        this.confidentlyUpdateNft().then((ready) => resolve(ready));
                    } else {
                        this.setState({
                            nft: new NonFungibleToken(this.state.formData.addr),
                        }); // will be invalid
                        resolve(false);
                    }
                });
        });
    }

    private async confidentlyUpdateNft(): Promise<boolean> {
        const { addr, tokenId } = this.state.formData;
        const newToken = await NonFungibleToken.init(addr, tokenId);
        this.setState({ nft: newToken });
        window.EDITOR.forceUpdate();
        return newToken.ready;
    }

    public override async validateForm(values: FormData): Promise<FormikErrors<FormData>> {
        this.setFormData(values);
        await new Promise((resolve) => this.resolveDebounced(resolve));
        await this.tryUpdateNft();
        await this.schema.check(values, {
            context: {
                token: this.state.nft?.token,
                multicallAddress: STORAGE.addresses.multicall,
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
                    label="Contract Address"
                    roundtop
                />
                <TextField
                    name="tokenId"
                    label="Token ID"
                />
                <TextField
                    name="accountId"
                    label="Address to be approved"
                />
                <CheckboxField
                    name="addMsg"
                    label="Specify msg"
                />
                {values.addMsg && (
                    <TextField
                        name="msg"
                        label="msg"
                        multiline
                    />
                )}
                <UnitField
                    name="gas"
                    unit="gasUnit"
                    options={["Tgas", "gas"]}
                    label="Allocated gas"
                />
                <UnitField
                    name="depo"
                    unit="depoUnit"
                    options={["NEAR", "yocto"]}
                    label="Attached deposit"
                    roundbottom
                />
            </Form>
        );
    };
}
