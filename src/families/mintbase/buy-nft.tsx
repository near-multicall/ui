import { Form, FormikErrors, useFormikContext } from "formik";
import { useEffect } from "react";
import MintbaseLogo from "../../app/static/mintbase/Mintbase_logo.svg";
import { args as arx } from "../../shared/lib/args/args";
import { fields } from "../../shared/lib/args/args-types/args-object";
import { Call, CallError } from "../../shared/lib/call";
import { MintbaseStore } from "../../shared/lib/contracts/mintbase";
import { toGas } from "../../shared/lib/converter";
import { InfoField, TextField, UnitField } from "../../shared/ui/form";
import { BaseTask, BaseTaskProps, BaseTaskState } from "../base";
import "./mintbase.scss";

import type { DefaultFormData } from "../base";

type FormData = DefaultFormData & {
    listingUrl: string;
};

type Props = BaseTaskProps;

type State = BaseTaskState<FormData> & {
    nftContractId: string | null;
    tokenId: string | null;
    metadataId: string | null;
    listingInfo: {
        price: string;
        title: string;
        token_id: string;
        market_id: string;
        media: string;
    } | null;
};

export class BuyNft extends BaseTask<FormData, Props, State> {
    override uniqueClassName = "mintbase-buy-nft-task";
    override schema = arx
        .object()
        .shape({
            listingUrl: arx
                .string()
                .url()
                .test({
                    name: "Mintbase listing URL",
                    message: "URL does not belong to a Mintbase listing",
                    test: (value) => value == null || value === "" || MintbaseStore.isListingURLValid(value),
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
        addr: MintbaseStore.SIMPLE_MARKETPLACE_ADDRESSES[0],
        func: "buy",
        listingUrl: "",
        gas: "200",
        gasUnit: "Tgas",
        depo: "0",
        depoUnit: "NEAR",
    };

    constructor(props: Props) {
        super(props);
        this._constructor();

        this.state = {
            ...this.state,
            nftContractId: null,
            tokenId: null,
            metadataId: null,
            listingInfo: null,
        };
    }

    protected override init(
        call: Call<{
            nft_contract_id: string;
            token_id: string;
        }> | null
    ): void {
        if (call !== null) {
            const fromCall = {
                addr: call.address,
                func: call.actions[0].func,
                gas: arx.big().intoFormatted(this.initialValues.gasUnit).cast(call.actions[0].gas).toFixed(),
                depo: arx.big().intoFormatted(this.initialValues.depoUnit).cast(call.actions[0].depo).toFixed(),
            };
            this.initialValues = Object.keys(this.initialValues).reduce((acc, k) => {
                const v = fromCall[k as keyof typeof fromCall];
                return v !== null && v !== undefined ? { ...acc, [k as keyof FormData]: v } : acc;
            }, this.initialValues);
        }

        this.state = { ...this.state, formData: this.initialValues };

        if (call !== null) {
            const nftContractId = call.actions[0].args.nft_contract_id;
            const tokenId = call.actions[0].args.token_id;
            MintbaseStore.apiGetMetadataId(nftContractId, tokenId).then((metadataId: string) =>
                this.setFormData(
                    {
                        listingUrl: `${MintbaseStore.UI_BASE_URL}/meta/${nftContractId}%3A${metadataId}`,
                    },
                    this.tryFetchListingInfo
                )
            );
        }
    }

    static override inferOwnType(json: Call): boolean {
        return (
            !!json &&
            MintbaseStore.SIMPLE_MARKETPLACE_ADDRESSES.includes(json.address) &&
            json.actions[0].func === "buy"
        );
    }

    public override toCall(): Call {
        const { gas, gasUnit, depo, depoUnit, addr } = this.state.formData;
        const { nftContractId, tokenId } = this.state;

        if (!arx.big().isValidSync(gas)) throw new CallError("Failed to parse gas input value", this.props.id);
        if (!arx.big().isValidSync(depo)) throw new CallError("Failed to parse deposit input value", this.props.id);

        return {
            address: addr,
            actions: [
                {
                    func: "buy",
                    args: {
                        nft_contract_id: nftContractId,
                        token_id: tokenId,
                    },
                    gas: arx.big().intoParsed(gasUnit).cast(gas).toFixed(),
                    depo: arx.big().intoParsed(depoUnit).cast(depo).toFixed(),
                },
            ],
        };
    }

    // TODO: fetch store owner/data
    private tryFetchListingInfo(): Promise<boolean> {
        return new Promise<boolean>((resolve) => {
            this.schema.check(this.state.formData).then(() => {
                const { listingUrl } = fields(this.schema);
                if (!listingUrl.isBad()) {
                    this.confidentlyFetchListingInfo().then((ready) => resolve(ready));
                } else {
                    this.setState({ tokenId: null, listingInfo: null, nftContractId: null, metadataId: null });
                    this.setFormData({ depo: "0", addr: MintbaseStore.SIMPLE_MARKETPLACE_ADDRESSES[0] });
                    resolve(false);
                }
            });
        });
    }

    // fetch store data/owner
    private async confidentlyFetchListingInfo(): Promise<boolean> {
        const { listingUrl, depoUnit } = this.state.formData;
        const { nftContractId, metadataId } = MintbaseStore.getInfoFromListingUrl(listingUrl)!;
        const listings = await MintbaseStore.apiGetSimpleListings(nftContractId, metadataId);
        if (listings.length === 0) {
            this.setState({ tokenId: null, listingInfo: null, nftContractId, metadataId });
            this.setFormData({ depo: "0", addr: MintbaseStore.SIMPLE_MARKETPLACE_ADDRESSES[0] });
            return false;
        }
        // find the cheapest token in the series
        const cheapest = listings.reduce((prev, curr) => (prev.price < curr.price ? prev : curr));
        this.setState({ nftContractId, tokenId: cheapest.token_id, metadataId, listingInfo: cheapest });
        this.setFormData({
            depo: arx.big().intoFormatted(depoUnit).cast(cheapest.price).toFixed(),
            addr: cheapest.market_id,
        });
        return true;
    }

    public override async validateForm(values: FormData): Promise<FormikErrors<FormData>> {
        this.setFormData(values);
        await new Promise((resolve) => this.resolveDebounced(resolve));
        await this.tryFetchListingInfo();
        return Object.fromEntries(
            Object.entries(fields(this.schema))
                .map(([k, v]) => [k, v?.message() ?? ""])
                .filter(([_, v]) => v !== "")
        );
    }

    public override Editor = (): React.ReactNode => {
        const { resetForm, validateForm } = useFormikContext();
        const { listingInfo, nftContractId } = this.state;

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
                {!!nftContractId && !!listingInfo && (
                    <InfoField>
                        <img
                            src={listingInfo.media}
                            alt="nft media"
                        />
                        <p className="entry">
                            <span className="key">Price</span>
                            <span className="value">{`${arx
                                .big()
                                .intoFormatted("NEAR")
                                .cast(listingInfo.price)} \u24C3`}</span>
                        </p>
                        <p className="entry">
                            <span className="key">Title</span>
                            <span className="value">{listingInfo.title}</span>
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
                    href="https://www.mintbase.io/"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    <span>powered by</span>
                    <img
                        src={MintbaseLogo}
                        alt="Mintbase"
                        className="logo"
                    />
                </a>
            </Form>
        );
    };
}
