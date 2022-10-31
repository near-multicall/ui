import { Form, FormikErrors, useFormikContext } from "formik";
import { useEffect } from "react";
import { args as arx } from "../../shared/lib/args/args";
import { fields } from "../../shared/lib/args/args-types/args-object";
import { Call, CallError } from "../../shared/lib/call";
import { toGas } from "../../shared/lib/converter";
import { STORAGE } from "../../shared/lib/persistent";
import { NonFungibleToken } from "../../shared/lib/standards/nonFungibleToken";
import { TextField, UnitField } from "../../shared/ui/form-fields";
import type { DefaultFormData } from "../base";
import { BaseTask, BaseTaskProps, BaseTaskState } from "../base";
import "./near.scss";

type FormData = DefaultFormData & {
    tokenId: string;
    receiverId: string;
    memo: string;
    msg: string;
};

type Props = BaseTaskProps;

type State = BaseTaskState<FormData> & {
    nft: NonFungibleToken;
};

export class NftTransferCall extends BaseTask<FormData, Props, State> {
    override uniqueClassName = "near-nft-transfer-call-task";
    override schema = arx
        .object()
        .shape({
            addr: arx.string().nft(),
            gas: arx.big().gas().min(toGas("1")).max(toGas("250")),
            tokenId: arx
                .string()
                .nftId("addr")
                .test({
                    name: "approval",
                    message: "multicall does not have permission to transfer this NFT",
                    test: (value, ctx) =>
                        value == null ||
                        ctx.options.context?.token == null ||
                        ctx.options.context?.multicallAddress == null ||
                        ctx.options.context.token.owner_id === ctx.options.context.multicallAddress ||
                        Object.keys(ctx.options.context.token.approved_account_ids).includes(
                            ctx.options.context.multicallAddress
                        ),
                }),
            receiverId: arx.string().address(),
            memo: arx.string().optional(),
            msg: arx.string().optional(),
        })
        .transform(({ gas, gasUnit, ...rest }) => ({
            ...rest,
            gas: arx.big().intoParsed(gasUnit).cast(gas),
        }))
        .requireAll({ ignore: ["memo", "msg"] })
        .retainAll();

    override initialValues: FormData = {
        name: "NFT Transfer Call",
        addr: "",
        func: "nft_transfer",
        gas: "75",
        gasUnit: "Tgas",
        depo: "1",
        depoUnit: "yocto",
        tokenId: "",
        receiverId: "",
        memo: "",
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
            receiver_id: string;
            amount: string;
            memo: string;
            msg: string;
        }> | null
    ): void {
        if (call !== null) {
            const fromCall = {
                addr: call.address,
                func: call.actions[0].func,
                gas: arx.big().intoFormatted(this.initialValues.gasUnit).cast(call.actions[0].gas).toFixed(),
                receiverId: call.actions[0].args.receiver_id,
                tokenId: call.actions[0].args.token_id,
                memo: call.actions[0].args.memo,
                msg: call.actions[0].args.msg,
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
        return !!json && json.actions[0].func === "nft_transfer";
    }

    public override toCall(): Call {
        const { addr, func, depo, gas, gasUnit, tokenId, receiverId, memo, msg } = this.state.formData;
        const { nft } = this.state;

        if (!arx.big().isValidSync(gas)) throw new CallError("Failed to parse gas input value", this.props.id);
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
                        receiver_id: receiverId,
                        ...(miIsOwner && { approval_id: approvalId }),
                        memo,
                        msg,
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
                    label="Contract Address"
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
                    name="msg"
                    label="Message"
                    multiline
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
