import { DeleteOutline, EditOutlined, MoveDown } from "@mui/icons-material";
import { Component } from "react";

import clsx from "clsx";
import { Form, Formik } from "formik";
import debounce from "lodash.debounce";
import { args as arx } from "../shared/lib/args/args";
import { fields } from "../shared/lib/args/args-types/args-object";
import { Call, CallError } from "../shared/lib/call";
import { Tooltip } from "../shared/ui/components";
import { TextField, UnitField } from "../shared/ui/form-fields";
import "./custom.scss";
import { BaseTask } from "./base";
import { unit } from "../shared/lib/converter";

type FormData = {
    name: string;
    addr: string;
    func: string;
    args: string;
    gas: string;
    gasUnit: number | unit;
    depo: string;
    depoUnit: number | unit;
};

export class CustomTask extends BaseTask<FormData> {
    uniqueClassName = "custom-task";
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

    initialValues: FormData = {
        name: "Custom",
        addr: "",
        func: "",
        args: "{}",
        gas: "0",
        gasUnit: "Tgas",
        depo: "0",
        depoUnit: "NEAR",
    };

    init(call: Call | null) {
        /*
        (!!json
            ? Object.entries({
                  addr: json.address,
                  func: json.actions[0].func,
                  args: JSON.stringify(json.actions[0].args),
                  gas: arx.big().intoFormatted(this.initialValues.gasUnit).cast(json.actions[0].gas).toFixed(),
                  depo: arx.big().intoFormatted(this.initialValues.depoUnit).cast(json.actions[0].depo).toFixed(),
              })
            : []
        ).forEach(([k, v]) => {
            if (v !== undefined && v !== null && this.initialValues[k as keyof FormData] !== undefined) {
                this.initialValues[k as keyof FormData] = v;
            }
        });
        */

        // that's better lol
        // okay, i'll try to begin with smth simple

        // me too, yours makes more sense

        // hmm, `this.initialValues[k as keyof FormData] !== undefined` looks weird, is this really needed?
        // (v !== undefined && v !== null && this.initialValues[k as keyof FormData] !== undefined)

        // what part of it? i think with the code below, no
        // yeah, just have a thought that key is always non-nullable

        // well, intialValues has more fields than this
        // ah, get it

        // if say call.address is undefined or null, does it still override whatever is in initialValues?
        // I'm gonna make a function-predicate to check it before override
        // but i think it will not override anything, so were good
        // hm, if you pass undefined to it, it'll
        // oh lol, I've forgotten about nullish coalescing again
        // so I don't need a function here
        // okay, stupid way first
        //

        // ywa, makes sense, but do you have a better solution?
        // yep, kinda

        // do you have a shorter solution?
        // I should make a swalow of my energy drink lol

        // what? :joy: yes, energy drink good!
        // hmm, im moving from stupid solutions to smarter ones, it's good at least :D

        // is it done?
        // hmm, gimme some time to clean it up a little

        if (call !== null) {
            const fromCall = {
                addr: call.address,
                func: call.actions[0].func,
                args: JSON.stringify(call.actions[0].args),
                gas: arx.big().intoFormatted(this.initialValues.gasUnit).cast(call.actions[0].gas).toFixed(),
                depo: arx.big().intoFormatted(this.initialValues.depoUnit).cast(call.actions[0].depo).toFixed(),
            };

            // OMG i remembered a function from Ramda which can make it in one turn
            // see Ramda.evolve

            // hmm, at least now it's better
            this.initialValues = Object.keys(this.initialValues).reduce(
                (result, key) =>
                    fromCall[key as keyof typeof fromCall] !== null &&
                    fromCall[key as keyof typeof fromCall] !== undefined
                        ? { ...result, [key as keyof FormData]: fromCall[key as keyof typeof fromCall] }
                        : result,

                this.initialValues
            );
        }

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
                    gas: arx.big().intoParsed(gasUnit).cast(gas).toFixed(),
                    depo: arx.big().intoParsed(depoUnit).cast(depo).toFixed(),
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
                initialTouched={Object.keys(this.state.formData).reduce((acc, k) => ({ ...acc, [k]: true }), {})}
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
                {({ resetForm, validateForm }) => {
                    if (init) {
                        resetForm(this.state.formData);
                        validateForm(this.state.formData);
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
