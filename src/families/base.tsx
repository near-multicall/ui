import { DeleteOutline, EditOutlined, MoveDown } from "@mui/icons-material";
import { Component } from "react";
import clsx from "clsx";
import debounce from "lodash.debounce";

import { args as arx } from "../shared/lib/args/args";
import { ObjectSchema } from "../shared/lib/args/args-types/args-object";
import { Call } from "../shared/lib/call";
import { unit } from "../shared/lib/converter";
import { Tooltip } from "../shared/ui/components";
import "./base.scss";

interface DefaultFormData {
    name: string;
    addr: string;
    func: string;
    args: string;
    gas: string;
    gasUnit: number | unit;
    depo: string;
    depoUnit: number | unit;
}

interface Props {
    id: string;
    json: object;
}

interface State<TFormData> {
    formData: TFormData;
    showArgs: boolean;
    isEdited: boolean;
}

export abstract class BaseTask<TFormData extends DefaultFormData> extends Component<Props, State<TFormData>> {
    abstract uniqueClassName: string;
    abstract schema: ObjectSchema<any>;
    abstract initialValues: TFormData;

    options = {};

    resolveDebounced = debounce((resolve) => resolve(), 400);

    constructor(props: Props, initialValues: TFormData) {
        super(props);

        let newState = {
            formData: initialValues,
            showArgs: false,
            isEdited: false,
        };

        if (window.TEMP) {
            this.state = { ...newState, ...this.loadFromTemp() };
            this.init(null);
        } else if (window.COPY?.payload) {
            this.state = { ...newState, ...this.loadFromCopy() };
            this.init(null);
        } else {
            this.init(this.props.json);
        }

        this.updateCard = this.updateCard.bind(this);

        document.addEventListener("onaddressesupdated", (e) => this.onAddressesUpdated(e as CustomEvent));
    }

    private loadFromTemp(): Partial<State<TFormData>> {
        const TEMP = window.TEMP!;
        this.initialValues = JSON.parse(JSON.stringify(TEMP.formData));
        this.options = TEMP.options;
        return {
            showArgs: TEMP.showArgs,
            isEdited: TEMP.isEdited,
        };
    }

    private loadFromCopy(): Partial<State<TFormData>> {
        const payload = window.COPY!.payload!;
        this.initialValues = JSON.parse(JSON.stringify(payload.formData));
        this.options = JSON.parse(JSON.stringify(payload.options));
        window.COPY = null;
        return {
            showArgs: payload.showArgs,
        };
    }

    protected abstract init(call: Call | null): void;

    static inferOwnType(call: Call): boolean {
        return false;
    }

    protected setFormData(newFormData: TFormData, callback: () => void) {
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

    protected abstract onAddressesUpdated(e: CustomEvent<{ dao: string; multicall: string; user: string }>): void;

    public onEditFocus(taskId: string) {
        this.setState({ isEdited: taskId === this.props.id });
    }

    public updateCard() {
        this.forceUpdate();
        window.EDITOR?.forceUpdate();
    }

    public abstract renderEditor(): JSX.Element;

    render() {
        const { showArgs, isEdited, formData } = this.state;

        const { name, addr, func, args, gas, gasUnit, depo, depoUnit } = formData;

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
                    <p>
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
                    {showArgs && (
                        <pre className="code">
                            {arx.string().json().isValidSync(args)
                                ? JSON.stringify(JSON.parse(args), null, "  ")
                                : args}
                        </pre>
                    )}
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
            </div>
        );
    }
}
