import { Form, FormikErrors, useFormikContext } from "formik";
import { useEffect } from "react";
import { args as arx } from "../../shared/lib/args/args";
import { fields } from "../../shared/lib/args/args-types/args-object";
import { Call, CallError } from "../../shared/lib/call";
import { toGas } from "../../shared/lib/converter";
import { STORAGE } from "../../shared/lib/persistent";
import { NonFungibleToken } from "../../shared/lib/standards/nonFungibleToken";
import { CheckboxField, InfoField, TextField, UnitField } from "../../shared/ui/form";
import type { DefaultFormData } from "../base";
import { BaseTask, BaseTaskProps, BaseTaskState } from "../base";
import "./near.scss";

type FormData = DefaultFormData & {
    tokenId: string;
    accountId: string;
    revokeAll: boolean;
};

type Props = BaseTaskProps;

type State = BaseTaskState<FormData> & {
    nft: NonFungibleToken;
};

export class NftRevoke extends BaseTask<FormData, Props, State> {
    override uniqueClassName = "near-nft-revoke-task";
    override schema = arx
        .object()
        .shape({
            addr: arx.string().nft(),
            gas: arx.big().gas().min(toGas("1"), "minimum 1 Tgas").max(toGas("250"), "maximum 250 Tgas"),
            depo: arx.big().token(),
            tokenId: arx
                .string()
                .nftId("addr")
                .test({
                    name: "approval",
                    message: "multicall must own the NFT",
                    test: (value, ctx) =>
                        value == null ||
                        ctx.options.context?.token == null ||
                        ctx.options.context?.multicallAddress == null ||
                        ctx.options.context.token.owner_id === ctx.options.context.multicallAddress,
                }),
            accountId: arx
                .string()
                .address()
                .requiredWhen("revokeAll", (revokeAll) => !revokeAll),
            revokeAll: arx.boolean(),
        })
        .transform(({ gas, gasUnit, accountId, revokeAll, ...rest }) => ({
            ...rest,
            revokeAll,
            gas: arx.big().intoParsed(gasUnit).cast(gas),
            ...(!revokeAll && { accountId }),
        }))
        .requireAll({ ignore: ["accountId"] })
        .retainAll();

    override initialValues: FormData = {
        name: "NFT Revoke",
        addr: "",
        func: "nft_revoke",
        gas: "10",
        gasUnit: "Tgas",
        depo: "1",
        depoUnit: "yocto",
        tokenId: "",
        accountId: "",
        revokeAll: false,
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
        }> | null
    ): void {
        if (call !== null) {
            const fromCall = {
                addr: call.address,
                func: call.actions[0].func,
                gas: arx.big().intoFormatted(this.initialValues.gasUnit).cast(call.actions[0].gas).toFixed(),
                accountId: call.actions[0].args.account_id,
                tokenId: call.actions[0].args.token_id,
                revokeAll: call.address === "nft_revoke_all",
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
        return !!json && (json.actions[0].func === "nft_revoke" || json.actions[0].func === "nft_revoke_all");
    }

    public override toCall(): Call {
        const { addr, func, depo, gas, gasUnit, tokenId, accountId, revokeAll } = this.state.formData;
        const { nft } = this.state;

        if (!arx.big().isValidSync(gas)) throw new CallError("Failed to parse gas input value", this.props.id);

        return {
            address: addr,
            actions: [
                {
                    func,
                    args: {
                        token_id: tokenId,
                        ...(!revokeAll && { account_id: accountId }),
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
        return newToken.ready;
    }

    public override async validateForm(values: FormData): Promise<FormikErrors<FormData>> {
        values.func = values.revokeAll ? "nft_revoke_all" : "nft_revoke";
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
        const approvedAccountIds = this.state.nft?.token?.approved_account_ids;

        useEffect(() => {
            resetForm({
                values: this.state.formData,
                touched: Object.keys(this.state.formData).reduce((acc, k) => ({ ...acc, [k]: true }), {}),
            });
            validateForm(this.state.formData);
        }, []);

        return (
            <Form className={`edit ${this.uniqueClassName}-edit`}>
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
                {!!approvedAccountIds && (
                    <InfoField>
                        <b>Approved account ids</b>
                        {Object.keys(approvedAccountIds).map((id) => (
                            <a
                                className="approved-account-id"
                                href={arx.string().intoUrl().cast(id)}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                {id}
                            </a>
                        ))}
                    </InfoField>
                )}
                <CheckboxField
                    name="revokeAll"
                    label="Revoke All"
                />
                {!values.revokeAll && (
                    <TextField
                        name="accountId"
                        label="Address to be revoked"
                        autocomplete={approvedAccountIds ? Object.keys(approvedAccountIds) : undefined}
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
