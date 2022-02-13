import React, { Component } from 'react'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import { ArgsAccount, ArgsBig, ArgsJSON, ArgsNumber, ArgsString, ArgsError } from '../utils/args';
import Call from '../utils/call';
import { toGas } from '../utils/converter';
import './base.scss';
import { TextInput, TextInputWithUnits } from '../components/editor/elements';

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

        this.updateCard = this.updateCard.bind(this);

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
                    value={ name }
                    variant="standard"
                    margin="normal"
                    update={ this.updateCard }
                />
                <TextInput
                    label="Contract address"
                    value={ addr }
                    error={ errors.addr }
                    update={ this.updateCard }
                />
                <TextInput 
                    label="Function name"
                    value={ func }
                    error={ errors.func }
                    update={ this.updateCard }
                />
                <TextInput
                    label="Function arguments"
                    value={ args }
                    error={ errors.args }
                    update={ this.updateCard }
                    multiline
                />
                <TextInputWithUnits 
                    label="Allocated gas"
                    value={ gas }
                    error={ errors.gas }
                    options={[ "gas", "Tgas" ]}
                    update={ this.updateCard }
                />
                <TextInputWithUnits 
                    label="Attached deposit"
                    value={ depo }
                    error={ errors.depo }
                    options={[ "yocto", "NEAR" ]}
                    update={ this.updateCard }
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