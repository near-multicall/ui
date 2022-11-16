// TODO: add checkbox and support "unstake_all".

import { Form, FormikErrors, useFormikContext } from "formik";
import { useEffect } from "react";
import MintbaseLogo from "../../app/static/mintbase/Mintbase_logo.svg";
import { args as arx } from "../../shared/lib/args/args";
import { fields } from "../../shared/lib/args/args-types/args-object";
import { Call, CallError } from "../../shared/lib/call";
import { MintbaseStore } from "../../shared/lib/contracts/mintbase";
import { Big, formatTokenAmount, toGas } from "../../shared/lib/converter";
import { InfoField, TextField, UnitField } from "../../shared/ui/form-fields";
import { BaseTask, BaseTaskProps, BaseTaskState } from "../base";
import "./mintbase.scss";

import type { StoreInfo } from "../../shared/lib/contracts/mintbase";
import type { DefaultFormData } from "../base";

type FormData = DefaultFormData & {
    listingUrl: string;
};

type Props = BaseTaskProps;

type State = BaseTaskState<FormData> & {
    nftContractId: string;
    tokenId: string;
    metadataId: string;
    listingInfo: {
        price: string;
        title: string;
        token_id: string;
        market_id: string;
        media: string;
    };
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
                    name: "check is valid Mintbase listing URL",
                    message: "URL does not belong to a Mintbase listing",
                    test: (value) => !!value && MintbaseStore.isListingURLValid(value),
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
        addr: MintbaseStore.SIMPLE_MARKETPLACE_ADDRESS,
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
                listingUrl: "haha",
                gas: arx.big().intoFormatted(this.initialValues.gasUnit).cast(call.actions[0].gas).toFixed(),
                depo: arx.big().intoFormatted(this.initialValues.depoUnit).cast(call.actions[0].depo).toFixed(),
            };
            this.initialValues = Object.keys(this.initialValues).reduce((acc, k) => {
                const v = fromCall[k as keyof typeof fromCall];
                return v !== null && v !== undefined ? { ...acc, [k as keyof FormData]: v } : acc;
            }, this.initialValues);
        }

        this.state = { ...this.state, formData: this.initialValues };
        this.schema.check(this.state.formData, { context: { storeOwner: this.state.mintbaseStoreInfo?.owner } });
    }

    static override inferOwnType(json: Call): boolean {
        return !!json && json.address === MintbaseStore.SIMPLE_MARKETPLACE_ADDRESS && json.actions[0].func === "buy";
    }

    public override toCall(): Call {
        const { gas, gasUnit, depo } = this.state.formData;
        const { nftContractId, tokenId } = this.state;

        if (!arx.big().isValidSync(gas)) throw new CallError("Failed to parse gas input value", this.props.id);
        if (!arx.big().isValidSync(depo)) throw new CallError("Failed to parse deposit input value", this.props.id);

        return {
            address: MintbaseStore.SIMPLE_MARKETPLACE_ADDRESS,
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

    // TODO: fetch store owner/data
    private tryFetchListingInfo(): Promise<boolean> {
        return new Promise<boolean>((resolve) => {
            this.schema
                .check(this.state.formData, { context: { storeOwner: this.state.mintbaseStoreInfo?.owner } })
                .then(() => {
                    const { listingUrl } = fields(this.schema);
                    if (!listingUrl.isBad()) {
                        this.confidentlyFetchListingInfo().then((ready) => resolve(ready));
                    } else {
                        this.setState({
                            nftContractId: "",
                            tokenId: "",
                            metadataId: "",
                        }); // will be invalid
                        resolve(false);
                    }
                });
        });
    }

    // fetch store data/owner
    private async confidentlyFetchListingInfo(): Promise<boolean> {
        const { listingUrl } = this.state.formData;
        const { nftContractId, metadataId } = MintbaseStore.getInfoFromlistingUrl(listingUrl)!;
        const listings = await MintbaseStore.apiGetSimpleListings(nftContractId, metadataId);
        if (listings.length === 0) return false;
        // find the cheapest token in the series
        let cheapest = listings[0];
        for (let i = 0; i < listings.length; i++) {
            if (Big(listings[i].price).lt(cheapest.price)) cheapest = listings[i];
        }
        this.setState({ nftContractId, tokenId: cheapest.token_id, metadataId, listingInfo: cheapest });
        window.EDITOR.forceUpdate();
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
        const { resetForm, validateForm, values } = useFormikContext<FormData>();
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
                {!!nftContractId && !!listingInfo ? (
                    <InfoField>
                        <b>Price: </b>
                        <div>{formatTokenAmount(listingInfo.price, 24, 5)}Ⓝ</div>
                        <b>Title: </b>
                        <div>{listingInfo.title}</div>
                        <img
                            src={listingInfo.media}
                            alt="nft media"
                        />
                    </InfoField>
                ) : null}
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
