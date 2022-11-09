import { DeleteOutline, EditOutlined, MoveDown } from "@mui/icons-material";
import { Component } from "react";
import clsx from "clsx";
import debounce from "lodash.debounce";

import { args as arx } from "../shared/lib/args/args";
import { fields, ObjectSchema } from "../shared/lib/args/args-types/args-object";
import { Call, CallError } from "../shared/lib/call";
import { unit } from "../shared/lib/converter";
import { Tooltip } from "../shared/ui/components";
import "./base.scss";
import { FormikErrors } from "formik";

export interface DefaultFormData {
    name: string;
    addr: string;
    func: string;
    gas: string;
    gasUnit: number | unit;
    depo: string;
    depoUnit: number | unit;
}

export interface DisplayData {
    name: string;
    addr: string;
    actions: {
        func: string;
        gas: string;
        gasUnit: string;
        depo: string;
        depoUnit: string;
        args: string;
    }[];
}

export interface BaseTaskProps {
    id: string;
    json: Call;
}

export interface BaseTaskState<TFormData> {
    formData: TFormData;
    showArgs: boolean;
    isEdited: boolean;
}

export abstract class BaseTask<
    TFormData extends DefaultFormData,
    Props extends BaseTaskProps = BaseTaskProps,
    State extends BaseTaskState<TFormData> = BaseTaskState<TFormData>
> extends Component<Props, State> {
    abstract uniqueClassName: string;
    abstract schema: ObjectSchema<any>;
    abstract initialValues: TFormData;

    options = {};

    resolveDebounced = debounce((resolve) => resolve(), 400);

    private initState: any;

    _constructor() {
        this.initState = {
            showArgs: false,
            isEdited: false,
        };

        if (window.TEMP) {
            this.loadFromTemp();
            this.init(null);
        } else if (window.COPY?.payload) {
            this.loadFromCopy();
            this.init(null);
        } else {
            this.init(this.props?.json ?? null);
        }

        this.state = { ...(this.initState as State), ...this.state };

        this.updateCard = this.updateCard.bind(this);

        document.addEventListener("onaddressesupdated", (e) => this.onAddressesUpdated(e as CustomEvent));
    }

    private loadFromTemp(): void {
        const TEMP = window.TEMP!;
        this.initialValues = JSON.parse(JSON.stringify(TEMP.formData));
        this.options = TEMP.options;
        this.initState = {
            ...this.initState,
            showArgs: TEMP.showArgs,
            isEdited: TEMP.isEdited,
        };
    }

    private loadFromCopy(): void {
        const payload = window.COPY!.payload!;
        this.initialValues = JSON.parse(JSON.stringify(payload.formData));
        this.options = JSON.parse(JSON.stringify(payload.options));
        window.COPY = null;
        this.initState = {
            ...this.initState,
            showArgs: payload.showArgs,
        };
    }

    protected abstract init(call: Call | null): void;

    static inferOwnType(call: Call): boolean {
        return false;
    }

    protected setFormData(newFormData: Partial<TFormData>, callback?: () => void) {
        this.setState(
            {
                formData: {
                    ...this.state.formData,
                    ...newFormData,
                },
            },
            callback
        );
    }

    public abstract toCall(): Call;

    componentDidMount() {
        this.schema.check(this.state.formData).then(() => this.updateCard());
    }

    protected onAddressesUpdated(e: CustomEvent<{ dao: string; multicall: string; user: string }>): void {}

    public onEditFocus(taskId: string) {
        this.setState({ isEdited: taskId === this.props.id });
    }

    public updateCard() {
        this.forceUpdate();
        window.EDITOR?.forceUpdate();
    }

    public async validateForm(values: TFormData): Promise<FormikErrors<TFormData>> {
        this.setFormData(values);
        await new Promise((resolve) => this.resolveDebounced(resolve));
        await this.schema.check(values);
        return Object.fromEntries(
            Object.entries(fields(this.schema))
                .map(([k, v]) => [k, v?.message() ?? ""])
                .filter(([_, v]) => v !== "")
        );
    }

    public abstract Editor: () => React.ReactNode;

    protected getDisplayData(): DisplayData {
        const { name, addr, func, gas, gasUnit, depo, depoUnit } = this.state.formData;
        let args = "";
        try {
            args = JSON.stringify(this.toCall().actions[0].args, null, " ");
        } catch (e) {
            if (e instanceof CallError) args = `Error: ${e.message}`;
        }
        return {
            name,
            addr,
            actions: [
                {
                    func,
                    gas,
                    gasUnit: gasUnit.toString(),
                    depo,
                    depoUnit: depoUnit.toString(),
                    args,
                },
            ],
        };
    }

    render() {
        const { showArgs, isEdited } = this.state;

        const { name, addr, actions } = this.getDisplayData();

        const hasErrors = this.schema.isBad();

        const { id } = this.props;

        return (
            <div
                className={clsx("task-container", this.uniqueClassName, {
                    "has-errors": hasErrors,
                    "is-edited": isEdited,
                })}
            >
                <div className="name">
                    <Tooltip
                        title="Edit"
                        disableInteractive
                    >
                        <EditOutlined
                            className="edit icon"
                            onClick={() => {
                                window.EDITOR.edit(id);
                                window.EDITOR.forceUpdate();
                                window.MENU.activeTabSwitch(1);
                            }}
                        />
                    </Tooltip>
                    <div className="edit-pseudo"></div>
                    <Tooltip
                        title={"Clone card"}
                        disableInteractive
                    >
                        <MoveDown
                            className="duplicate icon"
                            onClick={() => {
                                window.LAYOUT.duplicateTask(id);
                            }}
                        />
                    </Tooltip>
                    <div className="duplicate-pseudo"></div>
                    <h3>{name}</h3>
                    <Tooltip
                        title={"Delete"}
                        disableInteractive
                    >
                        <DeleteOutline
                            className="delete icon"
                            onClick={() => {
                                window.LAYOUT.deleteTask(id);
                            }}
                        />
                    </Tooltip>
                    <div className="delete-pseudo"></div>
                </div>
                <div className="data-container">
                    <p className="addr">
                        <span>Contract address</span>
                        <a
                            className="code"
                            href={arx.string().intoUrl().cast(addr)}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            {addr}
                        </a>
                    </p>
                    {actions.map(({ func, args, gas, gasUnit, depo, depoUnit }, i) => (
                        <div
                            className="action-data-container"
                            key={i}
                        >
                            <p>
                                <span>Function name</span>
                                <span className="code">{func}</span>
                            </p>
                            <p className="expandable">
                                <span>Function arguments</span>
                                {showArgs ? (
                                    <a onClick={() => this.setState({ showArgs: false })}>hide</a>
                                ) : (
                                    <a onClick={() => this.setState({ showArgs: true })}>show</a>
                                )}
                            </p>
                            {showArgs && <pre className="code">{args}</pre>}
                            <p>
                                <span>Allocated gas</span>
                                <span className="code">
                                    {gas} <span>{gasUnit}</span>
                                </span>
                            </p>
                            <p>
                                <span>Attached deposit</span>
                                <span className="code">
                                    {depo} <span>{depoUnit}</span>
                                </span>
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        );
    }
}
