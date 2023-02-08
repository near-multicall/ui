import { Form, FormikErrors, useFormikContext } from "formik";
import { useEffect } from "react";
import ParasLogo from "../../../../shared/static/paras/Paras_logo.svg";
import { args as arx } from "../../../../shared/lib/args/args";
import { fields } from "../../../../shared/lib/args/args-types/args-object";
import { Call, CallError } from "../../../../shared/lib/call";
import { Paras, type MarketDataJson } from "../../../../shared/lib/contracts/paras";
import { NonFungibleToken } from "../../../../shared/lib/standards/nonFungibleToken";
import { Big, formatTokenAmount, toGas } from "../../../../shared/lib/converter";
import { InfoField, TextField, UnitField } from "../../../../shared/ui/form";
import { BaseTask, BaseTaskProps, BaseTaskState } from "../base";
import "./paras.scss";

import type { TokenMetadata } from "../../../../shared/lib/standards/nonFungibleToken";
import type { DefaultFormData } from "../base";

type FormData = DefaultFormData & {
    listingUrl: string;
};

type Props = BaseTaskProps;

type State = BaseTaskState<FormData> & {
    marketData: MarketDataJson | null;
    metadata: TokenMetadata | null;
};

export class BuyNft extends BaseTask<FormData, Props, State> {
    override uniqueClassName = "paras-buy-nft-task";
    override schema = arx
        .object()
        .shape({
            listingUrl: arx
                .string()
                .url()
                .test({
                    name: "Paras listing URL",
                    message: "URL does not belong to a Paras listing",
                    test: (value) => value == null || value === "" || Paras.isListingURLValid(value),
                })
                .test({
                    name: "auction",
                    message: "Listing is an auction",
                    test: (value, ctx) =>
                        value == null || value === "" || ctx?.options.context?.marketData?.is_auction == null,
                }),
            gas: arx.big().gas().min(toGas("3.5")).max(toGas("250")),
        })
        .transform(({ gas, gasUnit, ...rest }) => ({
            ...rest,
            gas: arx.big().intoParsed(gasUnit).cast(gas),
        }))
        .requireAll()
        .retainAll();

    override initialValues: FormData = {
        name: "Simple Buy",
        addr: Paras.MARKETPLACE_ADDRESS,
        func: "buy",
        listingUrl: "",
        gas: "30",
        gasUnit: "Tgas",
        depo: "0",
        depoUnit: "yocto",
    };

    constructor(props: Props) {
        super(props);
        this._constructor();

        this.state = {
            ...this.state,
            marketData: null,
            metadata: null,
        };
    }

    protected override init(
        call: Call<{
            nft_contract_id: string;
            token_id: string;
        }> | null
    ): void {
        if (call !== null) {
            const nftContractId = call.actions[0].args.nft_contract_id;
            const tokenId = call.actions[0].args.token_id;
            const fromCall = {
                addr: call.address,
                func: call.actions[0].func,
                gas: arx.big().intoFormatted(this.initialValues.gasUnit).cast(call.actions[0].gas).toFixed(),
                depo: arx.big().intoFormatted(this.initialValues.depoUnit).cast(call.actions[0].depo).toFixed(),
                ...(nftContractId != null &&
                    nftContractId !== "" &&
                    tokenId != null &&
                    tokenId !== "" && {
                        listingUrl:
                            `${Paras.UI_BASE_URL}/token/${nftContractId}::` +
                            (tokenId.includes(":")
                                ? `${tokenId.split(":")[0]}/${encodeURIComponent(tokenId)}`
                                : tokenId),
                    }),
            };

            this.initialValues = Object.keys(this.initialValues).reduce((acc, k) => {
                const v = fromCall[k as keyof typeof fromCall];
                return v !== null && v !== undefined ? { ...acc, [k as keyof FormData]: v } : acc;
            }, this.initialValues);
        }

        this.state = { ...this.state, formData: this.initialValues };
    }

    static override inferOwnType(json: Call): boolean {
        return !!json && json.address === Paras.MARKETPLACE_ADDRESS && json.actions[0].func === "buy";
    }

    public override toCall(): Call {
        const { listingUrl, gas, gasUnit, depo } = this.state.formData;
        const { nftContractId, tokenId } = Paras.getInfoFromListingUrl(listingUrl) ?? {
            nftContractId: null,
            tokenId: null,
        };

        if (!arx.big().isValidSync(gas)) throw new CallError("Failed to parse gas input value", this.props.id);
        if (!arx.big().isValidSync(depo)) throw new CallError("Failed to parse deposit input value", this.props.id);

        return {
            address: Paras.MARKETPLACE_ADDRESS,
            actions: [
                {
                    func: "buy",
                    args: {
                        nft_contract_id: nftContractId,
                        token_id: tokenId,
                    },
                    gas: arx.big().intoParsed(gasUnit).cast(gas).toFixed(),
                    depo,
                },
            ],
        };
    }

    private tryLoadMarketData(): Promise<boolean> {
        return new Promise<boolean>((resolve) => {
            this.schema.check(this.state.formData, { context: { marketData: this.state.marketData } }).then(() => {
                const { listingUrl } = fields(this.schema);
                if (!listingUrl.isBad()) {
                    this.confidentlyLoadMarketData().then((ready) => resolve(ready));
                } else resolve(false);
            });
        });
    }

    private async confidentlyLoadMarketData(): Promise<boolean> {
        const { listingUrl } = this.state.formData;
        const { nftContractId, tokenId } = Paras.getInfoFromListingUrl(listingUrl)!;
        const [marketData, nft] = await Promise.all([
            Paras.getMarketData(nftContractId, tokenId),
            NonFungibleToken.init(nftContractId, tokenId),
        ]);
        this.setState({ marketData, metadata: nft.token?.metadata ?? null });
        return true;
    }

    public override async validateForm(values: FormData): Promise<FormikErrors<FormData>> {
        this.setFormData(values);
        await new Promise((resolve) => this.resolveDebounced(resolve));
        await this.tryLoadMarketData();
        return Object.fromEntries(
            Object.entries(fields(this.schema))
                .map(([k, v]) => [k, v?.message() ?? ""])
                .filter(([_, v]) => v !== "")
        );
    }

    public override Editor = (): React.ReactNode => {
        const { resetForm, validateForm } = useFormikContext();
        const { marketData, metadata } = this.state;

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
                    name="listingUrl"
                    label="Listing URL"
                    roundtop
                />
                {!!marketData && !!metadata && (
                    <InfoField>
                        <img
                            src={metadata.media!}
                            alt="nft media"
                        />
                        <p className="entry">
                            <span className="key">Price</span>
                            <span className="value">{`${arx
                                .big()
                                .intoFormatted("NEAR")
                                .cast(marketData.price)} \u24C3`}</span>
                        </p>
                        <p className="entry">
                            <span className="key">Title</span>
                            <span className="value">{metadata.title}</span>
                        </p>
                    </InfoField>
                )}
                <UnitField
                    name="gas"
                    unit="gasUnit"
                    options={["Tgas", "gas"]}
                    label="Allocated gas"
                    roundbottom
                />
                <a
                    className="protocol"
                    href="https://paras.id/"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    <span>powered by</span>
                    <img
                        src={ParasLogo}
                        alt="Paras"
                        className="logo"
                    />
                </a>
            </Form>
        );
    };
}
