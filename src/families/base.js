import React, { Component } from 'react'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import TextField from '@mui/material/TextField';
import { ArgsAccount, ArgsBig, ArgsJSON, ArgsNumber, ArgsString, ArgsError } from '../utils/args';
import Call from '../utils/call';
import { toGas } from '../utils/converter';
import './base.scss';

export default class BaseTask extends Component {

    uniqueClassName = "base-task";
    call;
    baseErrors = {
        addr: new ArgsError("Invalid address", value => ArgsAccount.isValid(value), true),
        func: new ArgsError("Cannot be empty", value => value != "", true),
        args: new ArgsError("Invalid JSON", value => JSON.parse(value)),
        gas: new ArgsError("Amount out of bounds", value => ArgsNumber.isValid(value), true),
        depo: new ArgsError("Amount out of bounds", value => ArgsBig.isValid(value) && value.value !== "" )
        // TODO regex check inputs, different errors?
    };
    errors = this.baseErrors;

    constructor(props) {
       
        super(props);

        this.state = {
            showArgs: false,
        };

        if (window.TEMP) {
            this.call = TEMP.call;
            this.state.showArgs = TEMP.showArgs;
            this.errors = TEMP.errors;
        } else 
            this.init(this.props.json);

    }

    init(json = null) {

        this.call = new Call({
            name: new ArgsString(json?.name ?? "Custom"),
            addr: new ArgsAccount(json?.addr ?? ""),
            func: new ArgsString(json?.func ?? ""),
            args: new ArgsJSON(json?.args ? JSON.stringify(json.args) : '{}'),
            gas: new ArgsNumber(json?.gas ?? 0, 0, toGas(300), "gas"),
            depo: new ArgsBig(json?.depo ?? "0", "0", null, "yocto")
        });

    }

    onAddressesUpdated() {}

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

        const gasOrTgas = [
            {
                value: 'gas',
                label: 'gas'
            },
            {
                value: 'Tgas',
                label: 'Tgas'
            },
        ];

        const yoctoOrNear = [
            {
                value: 'yocto',
                label: 'yocto'
            },
            {
                value: 'NEAR',
                label: 'NEAR'
            },
        ];

        return (
            <div className="edit">
                <TextField
                    value={ name }
                    variant="standard"
                    margin="normal"
                    onChange={e => {
                        name.value = e.target.value;
                        this.forceUpdate();
                    }}
                    InputLabelProps={{shrink: true}}
                />
                <TextField
                    label="Contract address"
                    value={ addr }
                    margin="dense"
                    size="small"
                    onChange={e => {
                        addr.value = e.target.value;
                        errors.addr.validOrNull(addr.value);
                        this.forceUpdate();
                        EDITOR.forceUpdate();
                    }}
                    error={errors.addr.isBad}
                    helperText={errors.addr.isBad && errors.addr.message}
                    InputLabelProps={{shrink: true}}
                />
                <TextField
                    label="Function name"
                    value={ func }
                    margin="dense"
                    size="small"
                    onChange={e => {
                        func.value = e.target.value;
                        errors.func.validOrNull(func.value);
                        this.forceUpdate();
                        EDITOR.forceUpdate();
                    }}
                    error={errors.func.isBad}
                    helperText={errors.func.isBad && errors.func.message}
                    InputLabelProps={{shrink: true}}
                />
                <TextField
                    label="Function arguments"
                    value={ errors.args.validOrNull(args.value) || errors.args.intermediate }
                    margin="dense"
                    size="small"
                    multiline   
                    onChange={e => {
                        args.value = e.target.value;
                        this.forceUpdate();
                        EDITOR.forceUpdate();
                    }}
                    error={errors.args.isBad}
                    helperText={errors.args.isBad && errors.args.message}
                    InputLabelProps={{shrink: true}}
                />
                <div className="unitInput">
                    <TextField
                        label="Allocated gas"
                        value={ gas }
                        margin="dense"
                        size="small"
                        type="number"
                        onChange={e => {
                            gas.value = e.target.value;
                            errors.gas.validOrNull(gas);
                            this.forceUpdate();
                            EDITOR.forceUpdate();
                        }}
                        error={errors.gas.isBad}
                        helperText={errors.gas.isBad && errors.gas.message}
                        InputLabelProps={{shrink: true}}
                    />
                    <TextField
                        label="Unit"
                        value={ gas.unit }
                        margin="dense"
                        size="small"
                        select
                        onChange={e => {
                            gas.unit = e.target.value;
                            errors.gas.validOrNull(gas);
                            EDITOR.forceUpdate();
                            this.forceUpdate();
                        }}
                        SelectProps={{
                            native: true,
                        }}
                    >
                        { gasOrTgas.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        )) }
                    </TextField>
                </div>
                <div className="unitInput">
                    <TextField
                        label="Attached deposit"
                        value={ depo }
                        margin="dense"
                        size="small"
                        type="number"
                        onChange={e => {
                            depo.value = e.target.value;
                            errors.depo.validOrNull(depo);
                            this.forceUpdate();
                            EDITOR.forceUpdate();
                        }}
                        error={errors.depo.isBad}
                        helperText={errors.depo.isBad && errors.depo.message}
                        InputLabelProps={{shrink: true}}
                    />
                    <TextField
                        label="Unit"
                        value={ depo.unit }
                        margin="dense"
                        size="small"
                        select
                        onChange={e => {
                            depo.unit = e.target.value;
                            errors.depo.validOrNull(depo);
                            EDITOR.forceUpdate();
                            this.forceUpdate();
                        }}
                        SelectProps={{
                            native: true,
                        }}
                    >
                        { yoctoOrNear.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        )) }
                    </TextField>
                </div>
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

        const { showArgs } = this.state;

        const { id } = this.props;

        return (
            <div 
                className={`task-container ${this.uniqueClassName}`}
            >
                <div className="name">
                    <h3>{ name.toString() }</h3>
                    <EditOutlinedIcon 
                        className="icon" 
                        onClick={() => {
                            EDITOR.edit(id);
                            MENU.changeTab(1);
                        }}
                    />
                </div>
                <div className="data-container">
                    <p><span>Contract address</span><a className="code" href={ addr.toUrl() } target="_blank" rel="noopener noreferrer">{ addr.toString() }</a></p>
                    <p><span>Function name</span><span className="code">{ func.toString() }</span></p>
                    <p className="expandable"><span>Function arguments</span>{ 
                        showArgs
                        ? <a onClick={ () => this.setState({ showArgs: false }) } >hide</a>
                        : <a onClick={ () => this.setState({ showArgs: true }) } >show</a>
                    }</p>
                    { showArgs && (errors.args.validOrNull(args.value)
                        ? <pre className="code">{ JSON.stringify(args.toString(), null, "  ") }</pre>
                        : <pre className="code">{ errors.args.intermediate }</pre>)
                    }
                    <p><span>Allocated gas</span><span className="code">{ gas.toString() } <span>{ gas.getUnit() }</span></span></p>
                    <p><span>Attached deposit</span><span className="code">{ depo.toString() }  <span>{ depo.getUnit() }</span></span></p>
                </div>
            </div>
        );

    }

}