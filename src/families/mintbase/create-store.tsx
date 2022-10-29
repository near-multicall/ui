import { Form, useFormikContext } from "formik";
import { useEffect } from "react";
import { args as arx } from "../../shared/lib/args/args";
import { Call, CallError } from "../../shared/lib/call";
import { BASE_URI_ARWEAVE, MintbaseStore } from "../../shared/lib/contracts/mintbase";
import { STORAGE } from "../../shared/lib/persistent";
import { TextField, UnitField } from "../../shared/ui/form-fields";
import { FileField } from "../../shared/ui/form-fields/file-field/file-field";
import { BaseTask, BaseTaskProps, DefaultFormData } from "../base";
import "./mintbase.scss";

type FormData = DefaultFormData & {
    owner: string;
    storeName: string;
    storeSymbol: string;
    icon: File | null;
};

type CreateStoreArgs = {
    owner_id: string;
    metadata: {
        spec: string;
        name: string;
        symbol: string;
        icon: string;
        base_uri: string;
        reference: string;
        reference_hash: string;
    };
};

export class CreateStore extends BaseTask<FormData> {
    override uniqueClassName = "mintbase-create-store-task";
    override schema = arx
        .object()
        .shape({
            owner: arx.string().address(),
            // TODO: lowercase() not working
            storeName: arx
                .string()
                .lowercase("only small letters")
                .test("is store name available", "This name is taken already", async (value) => {
                    if (value == null) return false;
                    try {
                        return !(await MintbaseStore.checkContainsStore(value));
                    } catch (e) {
                        // TODO check reason for error
                        // console.warn("error occured while checking for contract instance at", value);
                        return false;
                    }
                }),
            storeSymbol: arx.string().max(4, "up to 4 letters/numbers").lowercase("only small letters"),
            icon: arx.mixed<File>(),
            amount: arx.big().token(),
        })
        .transform(({ gas, gasUnit, amount, amountUnit, ...rest }) => ({
            ...rest,
            gas: arx.big().intoParsed(gasUnit).cast(gas),
            amount: arx.big().intoParsed(amountUnit).cast(amount),
        }))
        .requireAll()
        .retainAll();

    override initialValues: FormData = {
        name: "Create Store",
        addr: MintbaseStore.FACTORY_ADDRESS,
        func: "create_store",
        // TODO: try smaller values. See: https://explorer.mainnet.near.org/transactions/A1s4QPiP95bBe4bcgFHA5VooADdUoSEPCnVK5PByNpMm
        gas: "200",
        gasUnit: "Tgas",
        depo: "6.5",
        depoUnit: "NEAR",
        owner: STORAGE.addresses.multicall,
        storeName: "",
        storeSymbol: "",
        icon: null,
    };

    constructor(props: BaseTaskProps) {
        super(props);
        this._constructor();
    }

    protected override init(call: Call<CreateStoreArgs> | null): void {
        if (call !== null) {
            const fromCall = {
                addr: call.address,
                func: call.actions[0].func,
                owner: call.actions[0].args.owner_id,
                storeName: call.actions[0].args.metadata.name,
                storeSymbol: call.actions[0].args.metadata.symbol,
                icon: this.dataUtiToFile(call.actions[0].args.metadata.icon),
                gas: arx.big().intoFormatted(this.initialValues.gasUnit).cast(call.actions[0].gas).toFixed(),
                depo: arx.big().intoFormatted(this.initialValues.depoUnit).cast(call.actions[0].depo).toFixed(),
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
        return (
            !!json &&
            arx.string().address().isValidSync(json.address) &&
            json.address === MintbaseStore.FACTORY_ADDRESS &&
            json.actions[0].func === "create_store"
        );
    }

    public override toCall(): Call {
        const { addr, func, gas, gasUnit, depo, depoUnit, owner, storeName, storeSymbol, icon } = this.state.formData;

        if (!arx.big().isValidSync(gas)) throw new CallError("Failed to parse gas input value", this.props.id);
        if (!arx.big().isValidSync(depo)) throw new CallError("Failed to parse amount input value", this.props.id);

        return {
            address: addr,
            actions: [
                {
                    func,
                    args: {
                        owner_id: owner,
                        metadata: {
                            spec: "nft-1.0.0",
                            name: storeName,
                            symbol: storeSymbol,
                            icon: !!icon ? this.fileToDataUri(icon) : null,
                            base_uri: BASE_URI_ARWEAVE,
                            reference: null,
                            reference_hash: null,
                        },
                    },
                    gas: arx.big().intoParsed(gasUnit).cast(gas).toFixed(),
                    depo: arx.big().intoParsed(depoUnit).cast(depo).toFixed(),
                },
            ],
        };
    }

    private fileToDataUri(file: File): string {
        // TODO implement
        return "fake data URI";
    }

    private dataUtiToFile(dataUri: string): File {
        // TODO implement
        return new File([], "fake File");
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
                    name="owner"
                    label="Owner Address"
                    roundtop
                />
                <TextField
                    name="storeName"
                    label="Store Name"
                />
                <TextField
                    name="storeSymbol"
                    label="Symbol"
                />
                <FileField
                    name="icon"
                    label="Icon"
                    accept=".png,.jpeg,.gif,.svg+xml"
                />
                <UnitField
                    name="gas"
                    unit="gasUnit"
                    options={["Tgas", "gas"]}
                    label="Gas"
                />
                <UnitField
                    name="depo"
                    unit="depoUnit"
                    options={["NEAR", "yocto"]}
                    label="Deposit"
                    roundbottom
                />
            </Form>
        );
    };
}
