import { DeleteOutline, EditOutlined, MoveDown } from "@mui/icons-material";
import { Component } from "react";

import clsx from "clsx";
import { Form, Formik } from "formik";
import debounce from "lodash.debounce";
import { args as arx } from "../shared/lib/args/args";
import { fields } from "../shared/lib/args/args-types/args-object";
import { CallError } from "../shared/lib/call";
import { Tooltip } from "../shared/ui/components";
import { TextField, UnitField } from "../shared/ui/form-fields";
import "./base.scss";

export class BaseTask extends Component {
    uniqueClassName = "base-task";
    schema = arx
        .object()
        .shape({
            addr: arx.string().contract(),
            func: arx.string(),
            args: arx.string().json(),
            gas: arx.big().gas(),
            depo: arx.big().token(),
        })
        .transform(({ gas, gasUnit, depo, depoUnit, ...rest }) => ({
            ...rest,
            gas: arx.big().intoParsed(gasUnit).cast(gas),
            depo: arx.big().intoParsed(depoUnit).cast(depo),
        }))
        .requireAll()
        .retainAll();

    initialValues = {
        name: "Custom",
        addr: "",
        func: "",
        args: "{}",
        gas: "0",
        gasUnit: "Tgas",
        depo: "0",
        depoUnit: "NEAR",
    };

    options = {};

    resolveDebounced = debounce((resolve) => resolve(), 400);

    constructor(props) {
        super(props);

        this.state = {
            formData: this.initialValues,
            showArgs: false,
            isEdited: false,
        };

        if (window.TEMP) {
            this.state.formData = JSON.parse(JSON.stringify(TEMP.formData));
            this.state.showArgs = TEMP.showArgs;
            this.state.isEdited = TEMP.isEdited;
            this.options = TEMP.options;
            this.schema = TEMP.schema;
        } else if (window.COPY?.payload) {
            const optionsDeepCopy = JSON.parse(JSON.stringify(COPY.payload.options));
            const formDataDeepCopy = JSON.parse(JSON.stringify(COPY.payload.formData));

            this.init({
                name: COPY.payload.formData?.name?.toString(),
                ...formDataDeepCopy,
                options: optionsDeepCopy,
            });
            this.state.showArgs = COPY.payload.showArgs;
            COPY = null;
        } else {
            this.init(this.props.json);
        }

        this.updateCard = this.updateCard.bind(this);

        document.addEventListener("onaddressesupdated", (e) => this.onAddressesUpdated(e));
    }

    init(json = null) {
        let entries = [];
        if (!!json) entries = Object.entries({ addr: json.address, ...json.actions[0] });
        entries.forEach(([k, v]) => {
            if (v !== undefined && v !== null && this.initialValues[k] !== undefined) this.initialValues[k] = v;
        });

        this.state.formData = this.initialValues;
        this.schema.check(this.state.formData);
    }

    static inferOwnType(json) {
        return false;
    }

    setFormData(newFormData, callback) {
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

    toCall() {
        const { addr, func, args, gas, gasUnit, depo, depoUnit } = this.state.formData;
        if (!arx.string().json().isValidSync(args))
            throw new CallError("Failed to parse function arguments", this.props.id);
        return {
            address: addr,
            actions: [
                {
                    func,
                    args: JSON.parse(args),
                    gas: arx.big().intoParsed(gasUnit).cast(gas),
                    depo: arx.big().intoParsed(depoUnit).cast(depo),
                },
            ],
        };
    }

    componentDidMount() {
        this.schema.check(this.state.formData).then(() => this.updateCard());
    }

    onAddressesUpdated() {}

    onEditFocus(taskID) {
        this.setState({ isEdited: taskID === this.props.id });
    }

    updateCard() {
        this.forceUpdate();
        EDITOR.forceUpdate();
    }

    renderEditor() {
        let init = true;
        return (
            <Formik
                initialValues={this.state.formData}
                enableReinitialize={true}
                validate={async (values) => {
                    this.setFormData(values);
                    await new Promise((resolve) => this.resolveDebounced(resolve));
                    await this.schema.check(values);
                    return Object.fromEntries(
                        Object.entries(fields(this.schema))
                            .map(([k, v]) => [k, v?.message() ?? ""])
                            .filter(([_, v]) => v !== "")
                    );
                }}
                onSubmit={() => {}}
            >
                {({ resetForm }) => {
                    if (init) {
                        resetForm(this.state.formData);
                        init = false;
                    }
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
                                label="Contract Address"
                                roundTop
                            />
                            <TextField
                                name="func"
                                label="Function"
                            />
                            <TextField
                                name="args"
                                label="Function Arguments"
                            />
                            <UnitField
                                name="gas"
                                unit="gasUnit"
                                options={["Tgas", "gas"]}
                                label="Allocated gas"
                            />
                            <UnitField
                                name="depo"
                                unit="depoUnit"
                                options={["NEAR", "yocto"]}
                                label="Allocated deposit"
                                roundBottom
                            />
                        </Form>
                    );
                }}
            </Formik>
        );
    }

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
                                EDITOR.edit(id);
                                EDITOR.forceUpdate();
                                MENU.activeTabSwitch(1);
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
                                LAYOUT.duplicateTask(id);
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
                                LAYOUT.deleteTask(id);
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
