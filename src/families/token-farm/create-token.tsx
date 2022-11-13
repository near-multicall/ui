import { Form, FormikErrors, useFormikContext } from "formik";
import { useEffect } from "react";
import { args as arx } from "../../shared/lib/args/args";
import { fields } from "../../shared/lib/args/args-types/args-object";
import { Call, CallError } from "../../shared/lib/call";
import { TknFarm, TokenArgs } from "../../shared/lib/contracts/token-farm";
import { Big, unit } from "../../shared/lib/converter";
import { STORAGE } from "../../shared/lib/persistent";
import { StorageManagement, StorageBalance, StorageBalanceBounds } from "../../shared/lib/standards/storageManagement";
import { CheckboxField, InfoField, TextField, UnitField } from "../../shared/ui/form-fields";
import { BaseTask, BaseTaskProps, BaseTaskState, DefaultFormData } from "../base";
import { dataUrlToFile, fileToDataUrl } from "../../shared/lib/converter";
import * as TokenFarmSymbol from "../../app/static/token-farm/TokenFarm_symbol.png";
import "./token-farm.scss";
import { FileField } from "../../shared/ui/form-fields/file-field/file-field";

type FormData = DefaultFormData & {
    ownerId: string;
    totalSupply: string;
    tokenName: string;
    tokenSymbol: string;
    icon: File | null;
    decimals: number;
    spec: string;
    reference: string | null;
    reference_hash: string | null;
};

type Props = BaseTaskProps;

type State = BaseTaskState<FormData> & {
    iconDataUrl: string | null;
};

export class CreateToken extends BaseTask<FormData, Props, State> {
    override uniqueClassName = "token-farm-create-token-task";
    override schema = arx
        .object()
        .shape({
            gas: arx.big().gas(),
            ownerId: arx.string().address(),
            totalSupply: arx.big(),
            tokenName: arx.string(),
            tokenSymbol: arx
                .string()
                .matches(/^([a-z]|[0-9])+$/, "only lowercase letters or numbers")
                .test({
                    name: "symbol taken",
                    message: "token symbol is already taken",
                    test: async (value) => {
                        if (value == null) return true;
                        const token = await new TknFarm(TknFarm.FACTORY_ADDRESS).getToken(value);
                        return !token;
                    },
                }),
            icon: arx.mixed<File>(),
            decimals: arx.number(),
        })
        .transform(({ gas, gasUnit, ...rest }) => ({
            ...rest,
            gas: arx.big().intoParsed(gasUnit).cast(gas).toFixed(),
        }))
        .requireAll()
        .retainAll();

    override initialValues: FormData = {
        name: "Create Token",
        addr: TknFarm.FACTORY_ADDRESS,
        func: "create_token",
        gas: "90",
        gasUnit: "Tgas",
        depo: "0",
        depoUnit: "NEAR",
        ownerId: STORAGE.addresses.dao,
        totalSupply: "1000000000",
        tokenName: "",
        tokenSymbol: "",
        icon: null,
        decimals: 18,
        spec: "ft-1.0.0",
        reference: null,
        reference_hash: null,
    };

    constructor(props: BaseTaskProps) {
        super(props);
        this._constructor();

        this.state = {
            ...this.state,
        };
    }

    protected override init(
        call: Call<{
            args: TokenArgs;
        }> | null
    ): void {
        let iconDataUrl = null;
        if (call !== null) {
            iconDataUrl = call.actions[0].args.args.metadata?.icon;
            const fromCall = {
                addr: call.address,
                func: call.actions[0].func,
                gas: arx.big().intoFormatted(this.initialValues.gasUnit).cast(call.actions[0].gas).toFixed(),
                depo: arx.big().intoFormatted(this.initialValues.depoUnit).cast(call.actions[0].depo).toFixed(),
                ownerId: call.actions[0].args.args.owner_id,
                totalSupply: call.actions[0].args.args.total_supply,
                tokenName: call.actions[0].args.args.metadata.name,
                tokenSymbol: call.actions[0].args.args.metadata.symbol,
                icon: !!iconDataUrl ? dataUrlToFile(iconDataUrl, "token-icon") : null,
                decimals: call.actions[0].args.args.metadata.decimals,
                spec: call.actions[0].args.args.metadata.spec,
                reference: call.actions[0].args.args.metadata.reference,
                reference_hash: call.actions[0].args.args.metadata.reference_hash,
            };

            this.initialValues = Object.keys(this.initialValues).reduce((acc, k) => {
                const v = fromCall[k as keyof typeof fromCall];
                return v !== null && v !== undefined ? { ...acc, [k as keyof FormData]: v } : acc;
            }, this.initialValues);
        }

        this.state = {
            ...this.state,
            iconDataUrl: iconDataUrl ?? null,
            formData: this.initialValues,
        };
        this.schema.check(this.state.formData);

        this.tryUpdateDepo().catch(() => {});
    }

    static override inferOwnType(json: Call): boolean {
        return !!json && json.actions.length === 1 && json.actions[0].func === "create_token";
    }

    public override toCall(): Call {
        const {
            addr,
            func,
            gas,
            gasUnit,
            depo,
            depoUnit,
            ownerId,
            totalSupply,
            tokenName,
            tokenSymbol,
            icon,
            decimals,
            spec,
            reference,
            reference_hash,
        } = this.state.formData;
        const { iconDataUrl } = this.state;

        if (!arx.big().isValidSync(gas)) throw new CallError("Failed to parse gas input value", this.props.id);
        if (!arx.big().isValidSync(depo)) throw new CallError("Failed to parse depo input value", this.props.id);

        return {
            address: addr,
            actions: [
                {
                    func,
                    args: {
                        args: {
                            owner_id: ownerId,
                            total_supply: totalSupply,
                            metadata: {
                                spec,
                                name: tokenName,
                                symbol: tokenSymbol,
                                ...(!!icon && !!iconDataUrl && { icon: iconDataUrl }),
                                ...(!!reference && { reference }),
                                ...(!!reference_hash && { reference_hash }),
                                decimals,
                            },
                        },
                    },
                    gas: arx.big().intoParsed(gasUnit).cast(gas).toFixed(),
                    depo: arx.big().intoParsed(depoUnit).cast(depo).toFixed(),
                },
            ],
        };
    }

    private tryUpdateDepo(): Promise<boolean> {
        return new Promise<boolean>((resolve) => {
            this.schema.check(this.state.formData).then(() => {
                if (!this.schema.isBad()) {
                    this.confidentlyUpdateDepo().then(() => resolve(true));
                } else {
                    this.setFormData({
                        depo: "0",
                    });
                    resolve(false);
                }
            });
        });
    }

    private async confidentlyUpdateDepo(): Promise<boolean> {
        const { addr } = this.state.formData;
        const tknFarm = new TknFarm(addr);
        try {
            const args = (this.toCall() as Call<{ args: TokenArgs }>).actions[0].args.args;
            const minDeposit = await tknFarm.getRequiredDeposit(args, STORAGE.addresses.multicall);
            this.setFormData({
                depo: arx.big().intoFormatted(this.state.formData.depoUnit).cast(minDeposit).toFixed(),
            });
        } catch (e) {
            this.setFormData({ depo: "0" });
        }
        window.EDITOR.forceUpdate();
        return true;
    }

    public override async validateForm(values: FormData): Promise<FormikErrors<FormData>> {
        this.setFormData(values);
        await new Promise((resolve) => this.resolveDebounced(resolve));
        await this.tryUpdateDepo();
        await this.schema.check(this.state.formData);
        return Object.fromEntries(
            Object.entries(fields(this.schema))
                .map(([k, v]) => [k, v?.message() ?? ""])
                .filter(([_, v]) => v !== "")
        );
    }

    public override Editor = (): React.ReactNode => {
        const { resetForm, validateForm, values } = useFormikContext<FormData>();
        const { iconDataUrl } = this.state;

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
                    name="tokenName"
                    label="Token Name"
                    roundtop
                />
                <TextField
                    name="tokenSymbol"
                    label="Token Symbol"
                    roundtop
                />
                <TextField
                    name="decimals"
                    label="Token Decimals"
                    roundtop
                />
                <FileField
                    name="icon"
                    label="Icon"
                    accept=".png,.jpeg,.gif,.svg+xml"
                    onChange={async (event) => {
                        const file = (event.currentTarget as HTMLInputElement).files?.[0];
                        if (file) {
                            const dataUrl = await fileToDataUrl(file);
                            if (dataUrl) this.setState({ iconDataUrl: dataUrl });
                        }
                    }}
                />
                {arx.string().dataUrl().isValidSync(iconDataUrl) ? (
                    <InfoField>
                        <img
                            src={iconDataUrl}
                            alt="token icon"
                            onClick={() => window.open(iconDataUrl, "_blank")}
                        />
                    </InfoField>
                ) : null}
                <TextField
                    name="ownerId"
                    label="Owner Account ID"
                />
                <UnitField
                    name="gas"
                    unit="gasUnit"
                    options={["Tgas", "gas"]}
                    label="Allocated gas"
                    roundbottom
                />
                <a
                    className="protocol"
                    href="https://tkn.farm/"
                >
                    <span>powered by</span>
                    <img
                        className="logo"
                        src={TokenFarmSymbol}
                    />{" "}
                    <span>TokenFarm</span>
                </a>
            </Form>
        );
    };
}
