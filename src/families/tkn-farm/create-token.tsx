import { Form, FormikErrors, useFormikContext } from "formik";
import { useEffect } from "react";
import { args as arx } from "../../shared/lib/args/args";
import { fields } from "../../shared/lib/args/args-types/args-object";
import { Call, CallError } from "../../shared/lib/call";
import { TknFarm, TokenArgs } from "../../shared/lib/contracts/tkn-farm";
import { Big, unit } from "../../shared/lib/converter";
import { STORAGE } from "../../shared/lib/persistent";
import { StorageManagement, StorageBalance, StorageBalanceBounds } from "../../shared/lib/standards/storageManagement";
import { CheckboxField, InfoField, TextField, UnitField } from "../../shared/ui/form-fields";
import { BaseTask, BaseTaskProps, BaseTaskState, DefaultFormData } from "../base";
import * as TknFarmSymbol from "../../app/static/tkn-farm/symbol.png";
import "./tkn-farm.scss";

type FormData = DefaultFormData & {
    ownerId: string;
    totalSupply: string;
    tokenName: string;
    symbol: string;
    icon: File | null;
    decimals: number;
};

type Props = BaseTaskProps;

type State = BaseTaskState<FormData>;

export class CreateToken extends BaseTask<FormData, Props, State> {
    override uniqueClassName = "tkn-farm-create-token-task";
    override schema = arx
        .object()
        .shape({
            gas: arx.big().gas(),
            ownerId: arx.string().address(),
            totalSupply: arx.big(),
            tokenName: arx.string(),
            symbol: arx
                .string()
                .max(4, "maximum length is 4")
                .matches(/^([a-z]|[0-9])+$/, "only lowercase letters or numbers"),
            icon: arx.mixed<File>(),
            decimals: arx.number(),
        })
        .transform(({ gas, gasUnit, ...rest }) => ({
            ...rest,
            gas: arx.big().intoParsed(gasUnit).cast(gas).toFixed(),
        }))
        .requireAll()
        .retainAll();

    // TODO check tokenId doesnt exist already

    override initialValues: FormData = {
        name: "Create Token",
        addr: TknFarm.FACTORY_ADDRESS,
        func: "create_token",
        gas: "0",
        gasUnit: "Tgas",
        depo: "0",
        depoUnit: "NEAR",
        ownerId: STORAGE.addresses.dao,
        totalSupply: "",
        metadata: `{
    spec: "",
    name: "",
    symbol: "",
    icon: "",
    reference: "",
    reference_hash: "",
    decimals: 24
}`,
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
        if (call !== null) {
            const fromCall = {
                addr: call.address,
                func: call.actions[0].func,
                gas: arx.big().intoFormatted(this.initialValues.gasUnit).cast(call.actions[0].gas).toFixed(),
                depo: arx.big().intoFormatted(this.initialValues.depoUnit).cast(call.actions[0].depo).toFixed(),
                ownerId: call.actions[0].args.args.owner_id,
                totalSupply: call.actions[0].args.args.total_supply,
                metadata: JSON.stringify(call.actions[0].args.args.metadata, null, "  "),
            };

            this.initialValues = Object.keys(this.initialValues).reduce((acc, k) => {
                const v = fromCall[k as keyof typeof fromCall];
                return v !== null && v !== undefined ? { ...acc, [k as keyof FormData]: v } : acc;
            }, this.initialValues);
        }

        this.state = { ...this.state, formData: this.initialValues };
        this.schema.check(this.state.formData);

        this.tryUpdateDepo().catch(() => {});
    }

    static override inferOwnType(json: Call): boolean {
        return !!json && json.actions.length === 1 && json.actions[0].func === "create_token";
    }

    public override toCall(): Call {
        const { addr, func, gas, gasUnit, depo, depoUnit, ownerId, totalSupply, metadata } = this.state.formData;

        if (!arx.big().isValidSync(gas)) throw new CallError("Failed to parse gas input value", this.props.id);
        if (!arx.string().json().isValidSync(metadata)) throw new CallError("Failed to parse metadata", this.props.id);

        return {
            address: addr,
            actions: [
                {
                    func,
                    args: {
                        args: {
                            owner_id: ownerId,
                            total_supply: totalSupply,
                            metadata: JSON.parse(metadata),
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
                    name="ownerId"
                    label="Owner Address"
                    roundtop
                />
                <TextField
                    name="totalSupply"
                    label="Total Token Supply"
                />
                <TextField
                    name="metadata"
                    label="Token Metadata"
                    multiline
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
                        src={TknFarmSymbol}
                    />{" "}
                    <span>TokenFarm</span>
                </a>
            </Form>
        );
    };
}
