import { DeleteOutline, MoveDown, EditOutlined } from '@mui/icons-material';
import { Tooltip } from '@mui/material';
import React, { Component } from 'react';
import { TextInput, TextInputWithUnits } from '../components/editor/elements';
import { ArgsAccount, ArgsBig, ArgsError, ArgsJSON, ArgsString } from '../utils/args';
import { Call } from '../utils/call';
import { toGas, toYocto, formatTokenAmount, unitToDecimals } from '../utils/converter';
import './base.scss';

export default class BaseTask extends Component {

    uniqueClassName = "base-task";
    call;
    loadErrors;
    baseErrors = {
        addr: new ArgsError("Invalid address", value => ArgsAccount.isValid(value), true),
        func: new ArgsError("Cannot be empty", value => value.value != "", true),
        args: new ArgsError("Invalid JSON", value => JSON.parse(value.value)),
        gas: new ArgsError("Amount out of bounds", value => ArgsBig.isValid(value), true),
        depo: new ArgsError("Amount out of bounds", value => ArgsBig.isValid(value) && value.value !== "")
    };
    errors = this.baseErrors;
    options = {};

    constructor(props) {

        super(props);

        this.state = {
            showArgs: false,
            isEdited: false
        };

        if (window.TEMP) {

            this.call = TEMP.call;
            this.state.showArgs = TEMP.showArgs;
            this.options = TEMP.options;
            this.errors = TEMP.errors;

        } else if (window.COPY?.payload) {

            const optionsDeepCopy = JSON.parse(JSON.stringify(COPY.payload.options))

            this.init({
                name: COPY.payload.call?.name?.toString(),
                ...COPY.payload.call.toJSON(),
                units: COPY.payload.call.toUnits(),
                options: optionsDeepCopy
            });
            this.state.showArgs = COPY.payload.showArgs;
            COPY = null;

        } else

            this.init(this.props.json);

        this.updateCard = this.updateCard.bind(this);

        document.addEventListener('onaddressesupdated', (e) => this.onAddressesUpdated(e))

    }

    init(json = null) {

        const actions = json?.actions?.[0];
        const units = json?.units?.actions?.[0];

        this.call = new Call({
            name: new ArgsString(json?.name ?? "Custom"),
            addr: new ArgsAccount(json?.address ?? ""),
            func: new ArgsString(actions?.func ?? ""),
            args: new ArgsJSON(actions?.args ? JSON.stringify(actions?.args, null, "  ") : '{}'),
            gas: new ArgsBig(
                formatTokenAmount(actions?.gas ?? toGas("0"), units?.gas.decimals ?? unitToDecimals["Tgas"]),
                "1",
                toGas("300"),
                units?.gas?.unit ?? "Tgas",
                units?.gas?.decimals
            ),
            depo: new ArgsBig(
                formatTokenAmount(actions?.depo ?? toYocto("0"), units?.depo.decimals ?? unitToDecimals["NEAR"]),
                toYocto("0"),
                null,
                units?.depo?.unit ?? "NEAR",
                units?.depo?.decimals
            )
        });

        this.loadErrors = (() => {
            for (let e in this.errors)
                this.errors[e].validOrNull(this.call[e])
        }).bind(this);

    }

    static inferOwnType(json) {
        return false;
    }

    componentDidMount() {
        this.loadErrors?.();
        this.forceUpdate();
    }

    onAddressesUpdated() { }

    onEditFocus(taskID) {

        this.setState({isEdited: taskID === this.props.id})

    }

    updateCard() {

        this.forceUpdate();
        EDITOR.forceUpdate();

    }

    renderEditor() {

        const {
            name,
            addr,
            func,
            args,
            gas,
            depo
        } = this.call;

        const errors = this.errors;

        return (
            <div className="edit">
                <TextInput
                    value={name}
                    variant="standard"
                    margin="normal"
                    autoFocus
                    update={ this.updateCard }
                />
                <TextInput
                    label="Contract address"
                    value={addr}
                    error={errors.addr}
                    update={this.updateCard}
                />
                <TextInput
                    label="Function name"
                    value={func}
                    error={errors.func}
                    update={this.updateCard}
                />
                <TextInput
                    label="Function arguments"
                    value={args}
                    error={errors.args}
                    update={this.updateCard}
                    multiline
                />
                <TextInputWithUnits
                    label="Allocated gas"
                    value={gas}
                    error={errors.gas}
                    options={["Tgas", "gas"]}
                    update={this.updateCard}
                />
                <TextInputWithUnits
                    label="Attached deposit"
                    value={depo}
                    error={errors.depo}
                    options={["NEAR", "yocto"]}
                    update={this.updateCard}
                />
            </div>
        );

    }

    render() {

        const {
            name,
            addr,
            func,
            args,
            gas,
            depo
        } = this.call;

        const errors = this.errors;
        
        const hasErrors = Object.entries(errors)
            .filter(([k, v]) => v.isBad)
            .length > 0

        const { showArgs, isEdited } = this.state;

        const { id } = this.props;

        return (
            <div 
                className={`task-container ${this.uniqueClassName} ${hasErrors ? "has-errors" : ""} ${isEdited ? "is-edited" : ""}`}
            >
                <div className="name">
                    <Tooltip title={<h1 style={{ fontSize: "12px" }}>Edit</h1>} disableInteractive >
                        <EditOutlined
                            className="edit icon"
                            onClick={() => {
                                EDITOR.edit(id);
                                MENU.changeTab(1);
                            }}
                        />
                    </Tooltip>
                    <div className="edit-pseudo"></div>
                    <Tooltip title={<h1 style={{ fontSize: "12px" }}>Clone card</h1>} disableInteractive >
                        <MoveDown
                            className="duplicate icon"
                            onClick={() => {
                                LAYOUT.duplicateTask(id);
                            }}
                        />
                    </Tooltip>
                    <div className="duplicate-pseudo"></div>
                    <h3>{name.toString()}</h3>
                    <Tooltip title={<h1 style={{ fontSize: "12px" }}>Delete</h1>} disableInteractive >
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
                    <p><span>Contract address</span><a className="code" href={addr.toUrl()} target="_blank" rel="noopener noreferrer">{addr.toString()}</a></p>
                    <p><span>Function name</span><span className="code">{func.toString()}</span></p>
                    <p className="expandable"><span>Function arguments</span>{
                        showArgs
                            ? <a onClick={() => this.setState({ showArgs: false })} >hide</a>
                            : <a onClick={() => this.setState({ showArgs: true })} >show</a>
                    }</p>
                    {showArgs && (errors.args.validOrNull(args)
                        ? <pre className="code">{JSON.stringify(args.toString(), null, "  ")}</pre>
                        : <pre className="code">{errors.args.intermediate}</pre>)
                    }
                    <p><span>Allocated gas</span><span className="code">{gas.toString()} <span>{gas.unit}</span></span></p>
                    <p><span>Attached deposit</span><span className="code">{depo.toString()}  <span>{depo.unit}</span></span></p>
                </div>
            </div>
        );

    }

}
