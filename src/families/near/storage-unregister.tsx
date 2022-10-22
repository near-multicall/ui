import { Form, FormikErrors, useFormikContext } from "formik";
import { useEffect } from "react";
import { args as arx } from "../../shared/lib/args/args";
import { fields } from "../../shared/lib/args/args-types/args-object";
import { Call, CallError } from "../../shared/lib/call";
import { unit } from "../../shared/lib/converter";
import { STORAGE } from "../../shared/lib/persistent";
import { StorageManagement, StorageBalance } from "../../shared/lib/standards/storageManagement";
import { CheckboxField, InfoField, TextField, UnitField } from "../../shared/ui/form-fields";
import { BaseTask, BaseTaskProps, BaseTaskState, DefaultFormData } from "../base";
import "./near.scss";

type FormData = DefaultFormData;

type Props = BaseTaskProps;

type State = BaseTaskState<FormData> & {
    storageManagement: StorageManagement | null;
    storageBalance: StorageBalance | null;
};

export class StorageUnregister extends BaseTask<FormData, Props, State> {
    override uniqueClassName = "near-storage-unregister-task";
    override schema = arx
        .object()
        .shape({
            addr: arx.string().ft(),
            gas: arx.big().gas(),
        })
        .transform(({ gas, gasUnit, amount, amountUnit, ...rest }) => ({
            ...rest,
            gas: arx.big().intoParsed(gasUnit).cast(gas),
        }))
        .requireAll()
        .retainAll();

    override initialValues: FormData = {
        name: "Storage Unregister",
        addr: window.nearConfig.WNEAR_ADDRESS,
        func: "storage_unregister",
        gas: "7.5",
        gasUnit: "Tgas",
        depo: "1",
        depoUnit: "yocto",
    };

    constructor(props: BaseTaskProps) {
        super(props);
        this._constructor();

        this.state = {
            ...this.state,
            storageManagement: new StorageManagement(this.initialValues.addr),
            storageBalance: null,
        };

        this.tryUpdateSm().catch(() => {});
    }

    protected override init(
        call: Call<{
            amount: string;
        }> | null
    ): void {
        if (call !== null) {
            const fromCall = {
                addr: call.address,
                func: call.actions[0].func,
                gas: arx.big().intoFormatted(this.initialValues.gasUnit).cast(call.actions[0].gas).toFixed(),
            };

            this.initialValues = Object.keys(this.initialValues).reduce((acc, k) => {
                const v = fromCall[k as keyof typeof fromCall];
                return v !== null && v !== undefined ? { ...acc, [k as keyof FormData]: v } : acc;
            }, this.initialValues);
        }

        this.state = { ...this.state, formData: this.initialValues };
        this.schema.check(this.state.formData);

        if (call !== null) this.tryUpdateSm();
    }

    static override inferOwnType(json: Call): boolean {
        return (
            !!json && arx.string().address().isValidSync(json.address) && json.actions[0].func === "storage_unregister"
        );
    }

    public override toCall(): Call {
        const { addr, func, gas, gasUnit, depo } = this.state.formData;

        if (!arx.big().isValidSync(gas)) throw new CallError("Failed to parse gas input value", this.props.id);

        return {
            address: addr,
            actions: [
                {
                    func,
                    args: { force: false },
                    gas: arx.big().intoParsed(gasUnit).cast(gas).toFixed(),
                    depo,
                },
            ],
        };
    }

    private tryUpdateSm(): Promise<boolean> {
        return new Promise<boolean>((resolve) => {
            this.schema.check(this.state.formData).then(() => {
                const { addr } = fields(this.schema);
                if (!addr.isBad()) {
                    this.confidentlyUpdateSm().then(() => resolve(true));
                } else {
                    this.setState({
                        storageManagement: null,
                        storageBalance: null,
                    });
                    resolve(false);
                }
            });
        });
    }

    private async confidentlyUpdateSm(): Promise<boolean> {
        const { addr } = this.state.formData;
        const storageManagement = new StorageManagement(addr);
        const storageBalance = await storageManagement.storageBalanceOf(STORAGE.addresses.multicall);
        this.setState({ storageManagement, storageBalance });
        window.EDITOR.forceUpdate();
        return true;
    }

    public override async validateForm(values: FormData): Promise<FormikErrors<FormData>> {
        this.setFormData(values);
        await new Promise((resolve) => this.resolveDebounced(resolve));
        await this.tryUpdateSm();
        return Object.fromEntries(
            Object.entries(fields(this.schema))
                .map(([k, v]) => [k, v?.message() ?? ""])
                .filter(([_, v]) => v !== "")
        );
    }

    public override Editor = (): React.ReactNode => {
        const { resetForm, validateForm } = useFormikContext();
        const { storageBalance } = this.state;
        const balance = arx.big().intoFormatted("NEAR").cast(storageBalance?.total);

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
                    label="Token Address"
                    roundtop
                />
                {!!balance && <InfoField>{`Current available storage balance: ${balance} Ⓝ`}</InfoField>}
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
