// TODO: add checkbox and support "unstake_all".

import { Form, FormikErrors, useFormikContext } from "formik";
import { useEffect } from "react";
import { args as arx } from "../../shared/lib/args/args";
import { fields } from "../../shared/lib/args/args-types/args-object";
import { Call, CallError } from "../../shared/lib/call";
import { toGas } from "../../shared/lib/converter";
import { MintbaseStore } from "../../shared/lib/contracts/mintbase";
import { CheckboxField, InfoField, TextField, UnitField } from "../../shared/ui/form-fields";
import { BaseTask, BaseTaskProps, BaseTaskState } from "../base";
import "./mintbase.scss";
import { STORAGE } from "../../shared/lib/persistent";

import type { DefaultFormData } from "../base";
import type { StoreInfo } from "../../shared/lib/contracts/mintbase";

type FormData = DefaultFormData & {
    newMinter: string;
};

type Props = BaseTaskProps;

type State = BaseTaskState<FormData> & {
    mintbaseStore: MintbaseStore;
    mintbaseStoreInfo: StoreInfo;
    minters: string[];
};

export class AddMinter extends BaseTask<FormData, Props, State> {
    override uniqueClassName = "mintbase-add-minter-task";
    override schema = arx
        .object()
        .shape({
            addr: arx
                .string()
                .mintbaseStore()
                .test({
                    name: "check owner",
                    message: "store must be owned by the DAO's multicall",
                    test: (value, ctx) =>
                        value == null ||
                        ctx.options.context?.storeOwner == null ||
                        ctx.options.context.storeOwner === STORAGE.addresses.multicall,
                }),
            gas: arx.big().gas().min(toGas("3.5")).max(toGas("250")),
            newMinter: arx.string().address(),
        })
        .transform(({ gas, gasUnit, ...rest }) => ({
            ...rest,
            gas: arx.big().intoParsed(gasUnit).cast(gas),
        }))
        .requireAll()
        .retainAll();

    override initialValues: FormData = {
        name: "Add Minter",
        addr: "",
        func: "grant_minter",
        newMinter: "",
        gas: "30",
        gasUnit: "Tgas",
        depo: "1",
        depoUnit: "yocto",
    };

    constructor(props: Props) {
        super(props);
        this._constructor();
    }

    protected override init(
        call: Call<{
            account_id: string;
        }> | null
    ): void {
        if (call !== null) {
            const fromCall = {
                addr: call.address,
                func: call.actions[0].func,
                newMinter: call.actions[0].args.account_id,
                gas: arx.big().intoFormatted(this.initialValues.gasUnit).cast(call.actions[0].gas).toFixed(),
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
        return !!json && json.actions[0].func === "grant_minter";
    }

    public override toCall(): Call {
        const { addr, newMinter, gas, gasUnit, depo } = this.state.formData;

        if (!arx.big().isValidSync(gas)) throw new CallError("Failed to parse gas input value", this.props.id);
        if (!arx.big().isValidSync(depo)) throw new CallError("Failed to parse deposit input value", this.props.id);

        return {
            address: addr,
            actions: [
                {
                    func: "grant_minter",
                    args: {
                        account_id: newMinter,
                    },
                    gas: arx.big().intoParsed(gasUnit).cast(gas).toFixed(),
                    depo,
                },
            ],
        };
    }

    // TODO: fetch store owner/data
    private tryUpdateMintbaseStore(): Promise<boolean> {
        return new Promise<boolean>((resolve) => {
            this.schema
                .check(this.state.formData, { context: { storeOwner: this.state.mintbaseStoreInfo?.owner } })
                .then(() => {
                    const { addr } = fields(this.schema);
                    if (!addr.isBad()) {
                        this.confidentlyUpdateMintbaseStore().then((ready) => resolve(ready));
                    } else {
                        this.setState({
                            mintbaseStore: new MintbaseStore(this.state.formData.addr),
                            minters: [],
                        }); // will be invalid
                        resolve(false);
                    }
                });
        });
    }

    // fetch store data/owner
    private async confidentlyUpdateMintbaseStore(): Promise<boolean> {
        const { addr } = this.state.formData;
        const [store, storeInfo, minters] = await Promise.all([
            MintbaseStore.init(addr),
            new MintbaseStore(addr).getInfo(),
            new MintbaseStore(addr).listMinters(),
        ]);
        this.setState({ minters, mintbaseStore: store, mintbaseStoreInfo: storeInfo });
        window.EDITOR.forceUpdate();
        return store.ready;
    }

    public override async validateForm(values: FormData): Promise<FormikErrors<FormData>> {
        this.setFormData(values);
        await new Promise((resolve) => this.resolveDebounced(resolve));
        await this.tryUpdateMintbaseStore();
        return Object.fromEntries(
            Object.entries(fields(this.schema))
                .map(([k, v]) => [k, v?.message() ?? ""])
                .filter(([_, v]) => v !== "")
        );
    }

    public override Editor = (): React.ReactNode => {
        const { resetForm, validateForm, values } = useFormikContext<FormData>();
        const { minters } = this.state;

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
                    label="Store address"
                    roundtop
                />
                {minters?.length > 0 ? (
                    <InfoField>
                        <b>Minters: </b>
                        {minters?.toString()}
                    </InfoField>
                ) : null}
                <TextField
                    name="newMinter"
                    label="New minter"
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
